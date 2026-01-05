# Cloud Deployment Guide

## 1. AWS Deployment

### Architecture on AWS

```
┌────────────────────────────────────────────────┐
│                   Route 53                      │
│            (DNS Management)                     │
└────────────────┬───────────────────────────────┘
                 │
┌────────────────▼───────────────────────────────┐
│             CloudFront CDN                      │
│        (Static Assets Caching)                  │
└────────────────┬───────────────────────────────┘
                 │
┌────────────────▼───────────────────────────────┐
│          Application Load Balancer              │
│            (SSL Termination)                    │
└─────┬──────────────────────────┬───────────────┘
      │                          │
┌─────▼────────┐         ┌───────▼──────────┐
│   ECS/EC2    │         │   ECS/EC2        │
│  Backend     │         │  Frontend        │
│  (Fargate)   │         │  (Fargate)       │
└─────┬────────┘         └──────────────────┘
      │
┌─────▼────────────────────────┐
│  RDS MySQL (Multi-AZ)        │
│  ElastiCache Redis           │
│  S3 (File Storage)           │
└──────────────────────────────┘
```

### Prerequisites

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS credentials
aws configure
# AWS Access Key ID: your_access_key
# AWS Secret Access Key: your_secret_key
# Default region name: ap-southeast-1
# Default output format: json
```

### Step 1: Create VPC and Networking

```bash
# Create VPC
aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=qr-order-vpc}]'

# Create subnets
aws ec2 create-subnet \
  --vpc-id vpc-xxxxx \
  --cidr-block 10.0.1.0/24 \
  --availability-zone ap-southeast-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=qr-order-public-1a}]'

aws ec2 create-subnet \
  --vpc-id vpc-xxxxx \
  --cidr-block 10.0.2.0/24 \
  --availability-zone ap-southeast-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=qr-order-public-1b}]'
```

### Step 2: Setup RDS MySQL

```bash
# Create DB subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name qr-order-db-subnet \
  --db-subnet-group-description "QR Order DB Subnet" \
  --subnet-ids subnet-xxxxx subnet-yyyyy

# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier qr-order-db \
  --db-instance-class db.t3.medium \
  --engine mysql \
  --engine-version 8.0.35 \
  --master-username admin \
  --master-user-password YourSecurePassword123! \
  --allocated-storage 100 \
  --storage-type gp3 \
  --db-subnet-group-name qr-order-db-subnet \
  --vpc-security-group-ids sg-xxxxx \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --multi-az \
  --publicly-accessible false
```

### Step 3: Setup ElastiCache Redis

```bash
# Create cache subnet group
aws elasticache create-cache-subnet-group \
  --cache-subnet-group-name qr-order-redis-subnet \
  --cache-subnet-group-description "QR Order Redis Subnet" \
  --subnet-ids subnet-xxxxx subnet-yyyyy

# Create Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id qr-order-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-nodes 1 \
  --cache-subnet-group-name qr-order-redis-subnet \
  --security-group-ids sg-xxxxx
```

### Step 4: Setup ECS (Elastic Container Service)

```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name qr-order-cluster

# Create task definition (backend)
cat > task-definition-backend.json << EOF
{
  "family": "qr-order-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "your-account.dkr.ecr.ap-southeast-1.amazonaws.com/qr-order-backend:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "DB_HOST", "value": "qr-order-db.xxxxx.ap-southeast-1.rds.amazonaws.com"}
      ],
      "secrets": [
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:ap-southeast-1:xxxxx:secret:db-password"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/qr-order-backend",
          "awslogs-region": "ap-southeast-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
EOF

aws ecs register-task-definition --cli-input-json file://task-definition-backend.json
```

### Step 5: Setup Application Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name qr-order-alb \
  --subnets subnet-xxxxx subnet-yyyyy \
  --security-groups sg-xxxxx \
  --scheme internet-facing \
  --type application

# Create target group
aws elbv2 create-target-group \
  --name qr-order-backend-tg \
  --protocol HTTP \
  --port 5000 \
  --vpc-id vpc-xxxxx \
  --target-type ip \
  --health-check-path /api/v1/health

# Create listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:... \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

### Step 6: Deploy Services

```bash
# Create ECS service
aws ecs create-service \
  --cluster qr-order-cluster \
  --service-name qr-order-backend-service \
  --task-definition qr-order-backend \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx,subnet-yyyyy],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}" \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=backend,containerPort=5000
```

### Step 7: Setup Auto Scaling

```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/qr-order-cluster/qr-order-backend-service \
  --min-capacity 2 \
  --max-capacity 10

# Create scaling policy (CPU-based)
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/qr-order-cluster/qr-order-backend-service \
  --policy-name cpu-scaling-policy \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

**scaling-policy.json:**
```json
{
  "TargetValue": 75.0,
  "PredefinedMetricSpecification": {
    "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
  },
  "ScaleOutCooldown": 60,
  "ScaleInCooldown": 60
}
```

---

## 2. Google Cloud Platform (GCP) Deployment

### Architecture on GCP

```
Cloud DNS → Cloud CDN → Cloud Load Balancer
                              │
                ┌─────────────┴─────────────┐
                │                           │
          GKE Cluster                  GKE Cluster
          (Backend)                    (Frontend)
                │
                │
    ┌───────────┴────────────┐
    │                        │
Cloud SQL (MySQL)    Memorystore (Redis)
```

### Prerequisites

```bash
# Install gcloud CLI
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Initialize gcloud
gcloud init

# Set project
gcloud config set project qr-order-platform
```

### Deploy to Cloud Run (Serverless)

```bash
# Build and push image
gcloud builds submit --tag gcr.io/qr-order-platform/backend

# Deploy to Cloud Run
gcloud run deploy qr-order-backend \
  --image gcr.io/qr-order-platform/backend \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --set-secrets DB_PASSWORD=db-password:latest \
  --min-instances 1 \
  --max-instances 10 \
  --memory 1Gi \
  --cpu 1

# Get service URL
gcloud run services describe qr-order-backend --region asia-southeast1 --format 'value(status.url)'
```

---

## 3. DigitalOcean Deployment

### Using DigitalOcean App Platform

```yaml
# .do/app.yaml
name: qr-order-platform
services:
  - name: backend
    github:
      repo: your-org/qr-order-platform
      branch: main
      deploy_on_push: true
    source_dir: /backend
    dockerfile_path: Dockerfile
    http_port: 5000
    instance_count: 2
    instance_size_slug: professional-xs
    envs:
      - key: NODE_ENV
        value: production
      - key: DB_HOST
        value: ${db.HOSTNAME}
      - key: DB_PASSWORD
        value: ${db.PASSWORD}
        type: SECRET
    
  - name: frontend-customer
    github:
      repo: your-org/qr-order-platform
      branch: main
    source_dir: /frontend-customer
    build_command: npm run build
    run_command: npm start
    instance_count: 2

databases:
  - name: db
    engine: MYSQL
    version: "8"
    size: db-s-1vcpu-1gb
    num_nodes: 1

  - name: redis
    engine: REDIS
    version: "7"
    size: db-s-1vcpu-1gb
```

### Deploy with doctl

```bash
# Install doctl
snap install doctl

# Authenticate
doctl auth init

# Create app
doctl apps create --spec .do/app.yaml

# View apps
doctl apps list

# Get app logs
doctl apps logs  --type run
```

---

## 4. CI/CD with GitHub Actions

```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: cd backend && npm ci
      
      - name: Run tests
        run: cd backend && npm test
  
  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-southeast-1
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build and push Backend image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          cd backend
          docker build -t $ECR_REGISTRY/qr-order-backend:$IMAGE_TAG .
          docker push $ECR_REGISTRY/qr-order-backend:$IMAGE_TAG
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster qr-order-cluster \
            --service qr-order-backend-service \
            --force-new-deployment
```

---

## 5. Monitoring & Logging

### AWS CloudWatch

```bash
# Create log group
aws logs create-log-group --log-group-name /ecs/qr-order-backend

# Create metric filter for errors
aws logs put-metric-filter \
  --log-group-name /ecs/qr-order-backend \
  --filter-name ErrorCount \
  --filter-pattern "[timestamp, request_id, level = ERROR]" \
  --metric-transformations \
    metricName=ErrorCount,metricNamespace=QROrder,metricValue=1

# Create alarm
aws cloudwatch put-metric-alarm \
  --alarm-name qr-order-high-error-rate \
  --alarm-description "Alert when error rate is high" \
  --metric-name ErrorCount \
  --namespace QROrder \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

---

## Cost Optimization Tips

1. **Use Reserved Instances** for predictable workloads
2. **Enable Auto Scaling** to match demand
3. **Use Spot Instances** for non-critical tasks
4. **Implement Caching** to reduce database queries
5. **Optimize Docker images** to reduce build/deploy time
6. **Use CDN** for static assets
7. **Monitor and set billing alerts**
