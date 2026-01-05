let App = {
    windowW: $(window).width(),
    initHelpers: function ($helpers) {
        let me = this;
        $(document).ready(function () {
            me.initHelper('common');
            if ($helpers != undefined) {
                if ($helpers instanceof Array) {
                    for (let $index in $helpers) {
                        me.initHelper($helpers[$index]);
                    }
                } else {
                    me.initHelper($helpers);
                }
            } else {

            }
        });

    },
    initHelper: function ($helper) {
        let me = this;
        //console.log($helper);


        if ($helper.length > 0) {
            console.log('init <' + $helper + '> function window width = ' + me.windowW);
            App[$helper]();
        }

    },

    common: function () {
        //$('.close-noti').click(function () { // 23/05/2023: Dat dua vao custom.js / initPage()
        //    $('.td-wrapper').removeClass('active-noti')
        //})
        initPage();
        let me = this;
        if (me.windowW > 800) {
            $(".scrollTop").click(function () {
                $("html, body").animate({ scrollTop: 0 });
                return false;
            });
            $(".td-video").removeClass("hidden-video");
            $(".poster-mob").remove();
        } else {
            const videoElement = document.getElementsByClassName('td-video');
            checkCallVideo();
            //console.log(videoElement.length);
            function checkCallVideo() {
                for (let i = 0; i < videoElement.length; i++) {
                    videoElement[i].addEventListener('suspend', () => {
                        //console.log("suspend");
                    });
                    videoElement[i].addEventListener('play', () => {
                        //$("#testlowmode").html("play");
                        //console.log("play");
                        var parentBoxVideo = videoElement[i].parentNode;
                        parentBoxVideo.removeChild(parentBoxVideo.getElementsByClassName('poster-mob')[0]);
                        videoElement[i].classList.remove("hidden-video");
                    });
                }
            }
            //setInterval(function () {
            //    checkCallVideo();
            //}, 2000);
        }
    },
    bnerBottom: function () {

        let me = this;

        if (me.windowW > 800) {
            $('.bner-booking-bottom .video-bg').attr('src', 'https://storage.quannhautudo.com/Data/images/home/Bia-Web.mp4')
        } else {
            $('.bner-booking-bottom .video-bg').attr('src', 'https://storage.quannhautudo.com/Data/images/home/Bia-Mob.mp4')
        }
    },
    header: function () {

        let me = this;

        //if (me.windowW > 800) {

        //} else {
        //    $('.td-header .src-btn').click(function () {
        //        if ($(this).parent().parent().hasClass('expanded')) {
        //            $(this).parent().parent().removeClass('expanded')
        //        } else {
        //            $(this).parent().parent().addClass('expanded')
        //        }
        //    });

        //}
    },

    listBranch: function () {

        let me = this;

        if (me.windowW > 800) {
            $('a[href^="#"]').on('click', function (e) {
                e.preventDefault();
                var target = this.hash;
                var $target = $(target);
                $('.content-tab').stop().animate({
                    'scrollTop': $target.offset().top,

                }, 900, 'swing', function () {
                    // window.location.hash = target;
                });
                //console.log($target.offset().top)
            });
        } else {
            $('.branch-toggleBox .district-toggle').click(function () {
                if ($(this).parent().hasClass('active')) {
                    $(this).parent().removeClass('active')
                } else {
                    $(this).parent().addClass('active');
                    $('.branch-toggleBox .district-toggle').not(this).parent().removeClass('active');
                }
            });

            $(".branch-toggleBox .swiper-container").each(function () {
                let countChild = $(this).find('.swiper-wrapper').children().length;
                //console.log('So phan tu con: ' + countChild)
                if (countChild > 1) {
                    let swiperBranch = new Swiper('.swiper-branch', {
                        slidesPerView: 'auto',
                        spaceBetween: 0,
                    })
                } else {
                    $(this).addClass('one-child')
                }
            });

        }
    },

    foodPopup: function () {

        // Plus and Minus order in PopUp Detail
        $('.minus').click(function () {
            let $input = $(this).parent().find('input');
            let count = parseInt($input.val()) - 1;
            count = count < 1 ? 1 : count;
            $input.val(count);
            $input.change();
            return false;
        });
        $('.plus').click(function () {
            let $input = $(this).parent().find('input');
            $input.val(parseInt($input.val()) + 1);
            $input.change();
            return false;
        });

        let me = this;

        if (me.windowW > 800) {
            // Fancy Box Popup Detail
            $('.popupFood').off('click').click(function () {


                $.fancybox.open({
                    src: '#popup-detail-atc',
                    type: 'inline',
                    opts: {
                        protect: true,
                        animationDuration: 500,
                        // animationEffect: 'fade-in',
                        touch: false,
                        beforeShow: function () {
                            $('body').addClass('popup-active');
                        },
                        afterShow: function () {
                            swiperGallery = new Swiper(".swiper-gallery", {
                                slidesPerView: 1,
                                spaceBetween: 0,
                                pagination: {
                                    el: ".galleryBox .swiper-pagination",
                                    type: "fraction",
                                },
                                initialSlide: 0,
                            });


                        },
                        afterClose: function () {
                            $('body').removeClass('popup-active');
                            swiperGallery.destroy();
                        }
                    },
                });
            });
        } else {

            // Fancy Box Popup Detail
            $('.popupFood').off('click').click(function () {


                $.fancybox.open({
                    src: '#popup-detail-atc',
                    type: 'inline',
                    opts: {
                        protect: true,
                        animationDuration: 500,
                        animationEffect: 'slide-in-out',
                        touch: false,
                        beforeShow: function () {
                            $('body').addClass('popup-active');
                        },
                        afterShow: function () {
                            swiperGallery = new Swiper(".swiper-gallery", {
                                slidesPerView: 1,
                                spaceBetween: 0,
                                pagination: {
                                    el: ".galleryBox .swiper-pagination",
                                    type: "fraction",
                                },
                                initialSlide: 0,
                            });


                        },
                        afterClose: function () {
                            $('body').removeClass('popup-active');
                            swiperGallery.destroy();
                        }
                    },
                });
            });
        }
    },
    bookingPopup: function () {


        let me = this;

        /*if (me.windowW > 800) { // 23/05/2023: Dat move code vao booking.js
            // Fancy Box Popup Detail
            $('.bookingPopup').off('click').click(function () {


                $.fancybox.open({
                    src: '#popup-booking-atc',
                    type: 'inline',

                    opts: {

                        protect: true,
                        animationDuration: 500,
                        // animationEffect: 'fade-in',
                        touch: false,
                        clickSlide: false,
                        clickOutside: false,
                        beforeShow: function () {
                            $('body').addClass('popup-active');
                        },
                        afterShow: function () {
                            // Plus and Minus order in PopUp Detail
                            $('.minus').click(function () {
                                let $input = $(this).parent().find('input');
                                let count = parseInt($input.val()) - 1;
                                count = count < 1 ? 1 : count;
                                $input.val(count);
                                $input.change();
                                return false;
                            });
                            $('.plus').click(function () {
                                let $input = $(this).parent().find('input');
                                $input.val(parseInt($input.val()) + 1);
                                $input.change();
                                return false;
                            });


                            // Pick Date init
                            var $button_open_close = $('#button__api-open-close'),
                                $input_open_close = $('#demo__api-open-close').pickadate({
                                    monthsFull: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
                                    monthsShort: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
                                    weekdaysShort: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
                                    format: 'dd mmmm',
                                    formatSubmit: 'dd/mm/yyyy',
                                    firstDay: 1,
                                    today: 'Hôm nay',
                                    close: 'Đóng',
                                    min: 0,
                                    max: 90,
                                    clear: false,
                                    onOpen: function () {
                                        $button_open_close.text('Close')
                                    },
                                    onClose: function () {
                                        $button_open_close.text('Open')
                                    }
                                }),
                                picker_open_close = $input_open_close.pickadate()
                            $button_open_close.on('click', function (event) {
                                if (picker_open_close.get('open')) {
                                    picker_open_close.close()
                                } else {
                                    picker_open_close.open()
                                }
                                event.stopPropagation()
                            }).on('mousedown', function (event) {
                                event.preventDefault()
                            })

                            var $input_close_focus = $('#demo__api-close-focus').pickadate(),
                                picker_close_focus = $input_close_focus.pickadate()
                            $('#button__api-close-focus').on('click', function () {
                                picker_close_focus.close(true)
                            })

                            var $input_open_focus = $('#demo__api-open-focus').pickadate(),
                                picker_open_focus = $input_open_focus.pickadate()
                            $('#button__api-open-focus').on('click', function (event) {
                                picker_open_focus.open(false)
                                event.stopPropagation()
                                $(document).on('click.open_focus', function () {
                                    picker_open_focus.close()
                                    $(document).off('.open_focus')
                                })
                            })

                            $('.open-fancy-warning').off('click').click(function () {


                                $.fancybox.open({
                                    src: '#popup-warning',
                                    type: 'inline',
                                    opts: {
                                        protect: true,
                                        animationDuration: 500,
                                        touch: false,
                                        beforeShow: function () {
                                            $('body').addClass('popup-warning-active');


                                        },
                                        afterShow: function () {


                                        },
                                        afterClose: function () {
                                            $('body').removeClass('popup-warning-active');
                                        }
                                    },
                                });
                            });


                        },
                        afterClose: function () {
                            $('body').removeClass('popup-active');
                        }
                    },
                });
            });
            $('.open-fancy-warning').off('click').click(function () {


                $.fancybox.open({
                    src: '#popup-warning',
                    type: 'inline',
                    opts: {
                        protect: true,
                        animationDuration: 500,
                        touch: false,
                        beforeShow: function () {
                            $('body').addClass('popup-warning-active');


                        },
                        afterShow: function () {


                        },
                        afterClose: function () {
                            $('body').removeClass('popup-warning-active');
                        }
                    },
                });
            });
            $('.Popup-warning .confirm-btn').off('click').click(function () {
                $.fancybox.destroy();
            });

        } else {

            $('.bookingPopup').off('click').click(function () {


                $.fancybox.open({
                    src: '#popup-booking-atc',
                    type: 'inline',

                    opts: {

                        protect: true,
                        animationDuration: 500,
                        // animationEffect: 'fade-in',
                        touch: false,
                        clickSlide: false,
                        clickOutside: false,
                        beforeShow: function () {
                            $('body').addClass('popup-active');
                        },
                        afterShow: function () {
                            // Plus and Minus order in PopUp Detail
                            $('.minus').click(function () {
                                let $input = $(this).parent().find('input');
                                let count = parseInt($input.val()) - 1;
                                count = count < 1 ? 1 : count;
                                $input.val(count);
                                $input.change();
                                return false;
                            });
                            $('.plus').click(function () {
                                let $input = $(this).parent().find('input');
                                $input.val(parseInt($input.val()) + 1);
                                $input.change();
                                return false;
                            });


                            // Pick Date init
                            var $button_open_close = $('#button__api-open-close'),
                                $input_open_close = $('#demo__api-open-close').pickadate({
                                    monthsFull: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
                                    monthsShort: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
                                    weekdaysShort: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
                                    format: 'dd mmmm',
                                    formatSubmit: 'dd/mm/yyyy',
                                    firstDay: 1,
                                    today: 'Hôm nay',
                                    close: 'Đóng',
                                    min: 0,
                                    max: 90,
                                    clear: false,
                                    onOpen: function () {
                                        $button_open_close.text('Close')
                                    },
                                    onClose: function () {
                                        $button_open_close.text('Open')
                                    }
                                }),
                                picker_open_close = $input_open_close.pickadate()
                            $button_open_close.on('click', function (event) {
                                if (picker_open_close.get('open')) {
                                    picker_open_close.close()
                                } else {
                                    picker_open_close.open()
                                }
                                event.stopPropagation()
                            }).on('mousedown', function (event) {
                                event.preventDefault()
                            })

                            var $input_close_focus = $('#demo__api-close-focus').pickadate(),
                                picker_close_focus = $input_close_focus.pickadate()
                            $('#button__api-close-focus').on('click', function () {
                                picker_close_focus.close(true)
                            })

                            var $input_open_focus = $('#demo__api-open-focus').pickadate(),
                                picker_open_focus = $input_open_focus.pickadate()
                            $('#button__api-open-focus').on('click', function (event) {
                                picker_open_focus.open(false)
                                event.stopPropagation()
                                $(document).on('click.open_focus', function () {
                                    picker_open_focus.close()
                                    $(document).off('.open_focus')
                                })
                            })

                            $('.open-fancy-warning').off('click').click(function () {


                                $.fancybox.open({
                                    src: '#popup-warning',
                                    type: 'inline',
                                    opts: {
                                        protect: true,
                                        animationDuration: 500,
                                        touch: false,
                                        beforeShow: function () {
                                            $('body').addClass('popup-warning-active');


                                        },
                                        afterShow: function () {


                                        },
                                        afterClose: function () {
                                            $('body').removeClass('popup-warning-active');
                                        }
                                    },
                                });
                            });


                        },
                        afterClose: function () {
                            $('body').removeClass('popup-active');
                        }
                    },
                });
            });
            $('.open-fancy-warning').off('click').click(function () {


                $.fancybox.open({
                    src: '#popup-warning',
                    type: 'inline',
                    opts: {
                        protect: true,
                        animationDuration: 500,
                        touch: false,
                        beforeShow: function () {
                            $('body').addClass('popup-warning-active');


                        },
                        afterShow: function () {


                        },
                        afterClose: function () {
                            $('body').removeClass('popup-warning-active');
                        }
                    },
                });
            });
            $('.Popup-warning .confirm-btn').off('click').click(function () {
                $.fancybox.destroy();
            });
        }*/
    },
    menuList: function () {
        // Dat init function custom 

        /*Dat: Goi rieng trong file js: $('.tags-filter').each(function () {
            $(this).click(function () {
                $(".tags-filter").removeClass("active");
                $(this).addClass("active");
                scrollToId('head-menu');
            })
        });

        let me = this;

        if (me.windowW > 800) {
            let swiperMenuTags = new Swiper(".menu__tags-list", {
                slidesPerView: 'auto',
                spaceBetween: 20,
                freeMode: true,
                loop: false,
                navigation: {
                    nextEl: ".tagBox .swiper-button-next",
                    prevEl: ".tagBox .swiper-button-prev"
                }
            });
        } else {


        }*/
    },
    menuPopup: function () {


        let me = this;
        // da su dung js munu-list
        //if (me.windowW > 800) {
        //    // Fancy Box Popup Detail
        //    $('.menuPopup').off('click').click(function () {


        //        $.fancybox.open({
        //            src: '#popup-menu-atc',
        //            type: 'inline',

        //            opts: {

        //                protect: true,
        //                animationDuration: 500,
        //                // animationEffect: 'fade-in',
        //                touch: false,

        //                beforeShow: function () {
        //                    $('body').addClass('popup-active');
        //                },
        //                afterShow: function () {
        //                    // Plus and Minus order in PopUp Detail
        //                    $('.minus').click(function () {
        //                        let $input = $(this).parent().find('input');
        //                        let count = parseInt($input.val()) - 1;
        //                        count = count < 1 ? 1 : count;
        //                        $input.val(count);
        //                        $input.change();
        //                        return false;
        //                    });
        //                    $('.plus').click(function () {
        //                        let $input = $(this).parent().find('input');
        //                        $input.val(parseInt($input.val()) + 1);
        //                        $input.change();
        //                        return false;
        //                    });



        //                },
        //                afterClose: function () {
        //                    $('body').removeClass('popup-active');
        //                }
        //            },
        //        });
        //    });
        //    $('.open-fancy-warning').off('click').click(function () {


        //        $.fancybox.open({
        //            src: '#popup-warning',
        //            type: 'inline',
        //            opts: {
        //                protect: true,
        //                animationDuration: 500,
        //                touch: false,
        //                beforeShow: function () {
        //                    $('body').addClass('popup-warning-active');


        //                },
        //                afterShow: function () {


        //                },
        //                afterClose: function () {
        //                    $('body').removeClass('popup-warning-active');
        //                }
        //            },
        //        });
        //    });
        //    $('.Popup-warning .confirm-btn').off('click').click(function () {
        //        $.fancybox.destroy();
        //    });
        //} else {
        //    // Fancy Box Popup Detail
        //    $('.bookingPopup').off('click').click(function () {


        //        $.fancybox.open({
        //            src: '#popup-booking-atc',
        //            type: 'inline',
        //            opts: {
        //                protect: true,
        //                animationDuration: 500,
        //                animationEffect: 'slide-in-out',
        //                touch: false,
        //                clickSlide: false,
        //                clickOutside: false,
        //                beforeShow: function () {
        //                    $('body').addClass('popup-active');
        //                },
        //                afterShow: function () {
        //                    // Plus and Minus order in PopUp Detail
        //                    $('.minus').click(function () {
        //                        let $input = $(this).parent().find('input');
        //                        let count = parseInt($input.val()) - 1;
        //                        count = count < 1 ? 1 : count;
        //                        $input.val(count);
        //                        $input.change();
        //                        return false;
        //                    });
        //                    $('.plus').click(function () {
        //                        let $input = $(this).parent().find('input');
        //                        $input.val(parseInt($input.val()) + 1);
        //                        $input.change();
        //                        return false;
        //                    });


        //                },
        //                afterClose: function () {
        //                    $('body').removeClass('popup-active');
        //                }
        //            },
        //        });
        //    });
        //}
    },

    foodDetail: function () {

        let me = this;

        if (me.windowW > 800) {
            swiperGallery = new Swiper(".swiper-gallery", {
                slidesPerView: 1,
                spaceBetween: 0,
                pagination: {
                    el: ".galleryBox .swiper-pagination",
                    type: "fraction",
                },
                initialSlide: 0,
            });

        } else {

            swiperGallery = new Swiper(".swiper-gallery", {
                slidesPerView: 1,
                spaceBetween: 10,
                pagination: {
                    el: ".galleryBox .swiper-pagination",
                    type: "fraction",
                },
                initialSlide: 0,
            });
        }
    },
    bookingDetail: function () {

        // Plus and Minus order in PopUp Detail
        $('.minus').click(function () {
            let $input = $(this).parent().find('input');
            let count = parseInt($input.val()) - 1;
            count = count < 1 ? 1 : count;
            $input.val(count);
            $input.change();
            return false;

        });
        $('.plus').click(function () {
            let $input = $(this).parent().find('input');
            $input.val(parseInt($input.val()) + 1);
            $input.change();
            return false;
        });

        // Pick Date init
        var $button_open_close = $('#button__api-open-close'),
            $input_open_close = $('#demo__api-open-close').pickadate({
                monthsFull: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
                monthsShort: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
                weekdaysShort: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
                format: 'dd mmmm',
                formatSubmit: 'dd/mm/yyyy',
                firstDay: 1,
                today: 'Hôm nay',
                close: 'Đóng',
                min: 0,
                max: 90,
                clear: false,
                onOpen: function () {
                    $button_open_close.text('Close')
                },
                onClose: function () {
                    $button_open_close.text('Open')
                }
            }),
            picker_open_close = $input_open_close.pickadate()
        $button_open_close.on('click', function (event) {
            if (picker_open_close.get('open')) {
                picker_open_close.close()
            } else {
                picker_open_close.open()
            }
            event.stopPropagation()
        }).on('mousedown', function (event) {
            event.preventDefault()
        })

        var $input_close_focus = $('#demo__api-close-focus').pickadate(),
            picker_close_focus = $input_close_focus.pickadate()
        $('#button__api-close-focus').on('click', function () {
            picker_close_focus.close(true)
        })

        var $input_open_focus = $('#demo__api-open-focus').pickadate(),
            picker_open_focus = $input_open_focus.pickadate()
        $('#button__api-open-focus').on('click', function (event) {
            picker_open_focus.open(false)
            event.stopPropagation()
            $(document).on('click.open_focus', function () {
                picker_open_focus.close()
                $(document).off('.open_focus')
            })
        })
        let me = this;

        if (me.windowW > 800) {


        } else {


        }
    },
    coso: function () {
        new WOW().init();

        let me = this;

        //$('.csdcb-toc .toc-header').click(function () {
        //    if ($(this).parent().hasClass('active')) {
        //        $(this).parent().removeClass('active')
        //    } else {
        //        $(this).parent().addClass('active');

        //    }
        //});
        if (me.windowW > 800) {
            $('.ccbr-gallery').each(function () {
                //console.log($(this).find(".ccbr-thumb").length);
                if ($(this).find(".ccbr-thumb").length > 1) {
                    swiperGallery = new Swiper($(this), {
                        slidesPerView: 1,
                        spaceBetween: 0,
                        freeMode: true,
                        navigation: {
                            nextEl: ".swiper-button-next",
                            prevEl: ".swiper-button-prev",
                        },
                    });
                }
            });
        } else {

            $.each($('.cc-wrapper .ccBox'), function (i, v) {
                let insertRowPhone = $(v).find(".ccbl-des");
                $(v).find('.ccbl-phone').insertAfter(insertRowPhone);
            });

            $('.cosoDetail-wrapper .csdcb-phone').insertAfter(".cosoDetail-wrapper .csdcb-des");

            swiperMultiBox = new Swiper(".ccBox-container.multiBox", {
                slidesPerView: 'auto',
                spaceBetween: 10,
                freeMode: true,
            });
        }
    },
    news: function () {

        let me = this;

        if (me.windowW > 800) {


        } else {
            $(".btnPagination.btnPrev").insertBefore(".nf-left");

            // swiperMultiNews = new Swiper(".newsDetail-wrapper .grid-news-container", {
            //     slidesPerView: 'auto',
            //     spaceBetween: 15,
            //     freeMode: true,
            // });
        }
    },

    home: function () {
        gsap.registerPlugin(ScrollTrigger);

        //SlpitText
        const wrapElements = (elems, wrapType, wrapClass) => {
            elems.forEach(char => {
                const wrapEl = document.createElement(wrapType);
                wrapEl.classList = wrapClass;
                char.parentNode.appendChild(wrapEl);
                wrapEl.appendChild(char);
            });
        }

        Splitting();

        const fx1Titles = [...document.querySelectorAll('.content__title[data-splitting][data-effect1]')];

        let me = this;

        if (me.windowW > 800) {

            //$.fn.calHeightBranch = function () {
            //    let hBranch = $('.branch-web .branch-left').innerHeight();

            //    $('.branch-web .content-right').css('max-height', hBranch);

            //    console.log('Height branch' + hBranch)
            //}
            //$.fn.calHeightBranch();

            //$(window).resize(function () {
            //    $.fn.calHeightBranch();
            //});
            // GSAP Scroll Triggers
            //fx1Titles.forEach(title => {
            //    const words = [...title.querySelectorAll('.word')];

            //    for (const word of words) {

            //        const chars = word.querySelectorAll('.char');
            //        const charsTotal = chars.length;

            //        gsap.fromTo(chars, {
            //            'will-change': 'transform, filter',
            //            transformOrigin: '50% 100%',
            //            scale: position => {
            //                const factor = position < Math.ceil(charsTotal / 2) ? position : Math.ceil(charsTotal / 2) - Math.abs(Math.floor(charsTotal / 2) - position) - 1;
            //                return gsap.utils.mapRange(0, Math.ceil(charsTotal / 2), 0.5, 2.1, factor);
            //            },
            //            y: position => {
            //                const factor = position < Math.ceil(charsTotal / 2) ? position : Math.ceil(charsTotal / 2) - Math.abs(Math.floor(charsTotal / 2) - position) - 1;
            //                return gsap.utils.mapRange(0, Math.ceil(charsTotal / 2), 0, 60, factor);
            //            },
            //            rotation: position => {
            //                const factor = position < Math.ceil(charsTotal / 2) ? position : Math.ceil(charsTotal / 2) - Math.abs(Math.floor(charsTotal / 2) - position) - 1;
            //                return position < charsTotal / 2 ? gsap.utils.mapRange(0, Math.ceil(charsTotal / 2), -4, 0, factor) : gsap.utils.mapRange(0, Math.ceil(charsTotal / 2), 0, 4, factor);
            //            },
            //            filter: 'blur(12px) opacity(0)',
            //        }, {
            //            ease: 'power2.inOut',
            //            y: 0,
            //            rotation: 0,
            //            scale: 1,
            //            delay: 0.3,
            //            filter: 'blur(0px) opacity(1)',
            //            duration: 1.2,
            //            scrollTrigger: {
            //                start: 'center bottom',
            //                end: 'bottom top',
            //                trigger: title,
            //            },
            //            stagger: {
            //                amount: 0.15,
            //                from: 'center'
            //            }
            //        });

            //    }
            //});

            var scenePrl = document.getElementById('scenePrl');
            var parallaxInstance = new Parallax(scenePrl);

            // Parallax Vertical
            function parallax() {
                var parallaxController = new ScrollMagic.Controller({
                    globalSceneOptions: {
                        triggerHook: "onEnter",
                        duration: "200%"
                    }
                });

                $('.parallax').each(function () {
                    var trig = this.parentNode,
                        parallax = this.getAttribute('data-parallax'),
                        speed = parallax * 100 + '%';

                    new ScrollMagic.Scene({triggerElement: trig})
                        .setTween(this, {y: speed, ease: Linear.easeNone})
                        .addTo(parallaxController);
                })
            }

            parallax();

            // Parallax Horizontal
            function parallaxHoz() {
                var parallaxHController = new ScrollMagic.Controller({
                    globalSceneOptions: {
                        triggerHook: "onEnter",
                        duration: "200%"
                    }
                });

                $('.parallaxHoz').each(function () {
                    var trigH = this.parentNode,
                        parallaxH = this.getAttribute('data-parallax'),
                        speedH = parallaxH * 100 + '%';

                    new ScrollMagic.Scene({ triggerElement: trigH })
                        .setTween(this, { x: speedH, ease: Linear.easeNone })
                        .addTo(parallaxHController);
                })
            }

            parallaxHoz();

            let swiperNewFood = new Swiper('.swiper-newfood', {
                slidesPerView: 4,
                slidesPerGroup: 4,
                spaceBetween: 25,
                pagination: {
                    el: ".swiper-pagination",
                    dynamicBullets: true,
                    dynamicMainBullets: 2
                },
                navigation: {
                    nextEl: '.new-food .swiper-button-next',
                    prevEl: '.new-food .swiper-button-prev',
                },
                pagination: {
                    el: '.swiper-newfood .swiper-pagination',
                    clickable: true,
                },
            })

            let swiperDscHome = new Swiper('.swiper-dscHome', {
                slidesPerView: 3,
                slidesPerGroup: 3,
                spaceBetween: 24,
                navigation: {
                    nextEl: '.discount-box .swiper-button-next',
                    prevEl: '.discount-box .swiper-button-prev',
                },
                pagination: {
                    el: '.swiper-dscHome .swiper-pagination',
                    clickable: true,
                },
            })

            let windowHeight = window.innerHeight;

            const tl = gsap.timeline().fromTo('.box-2', { y: windowHeight }, { y: 0 })

            ScrollTrigger.create({
                trigger: '.slide-up-box',
                animation: tl,
                pin: true,
                start: 'top top',
                end: 2.3 * windowHeight + ' bottom',
                duration: 1,
                scrub: 0,
                // markers: true,
            })

            const elemFade = gsap.utils.toArray('.fade-inup');
            elemFade.forEach((elemAnim) => {
                gsap.from(elemAnim, {
                    scrollTrigger: {
                        start: 'center bottom',
                        end: 'bottom top',
                        trigger: elemAnim,
                        onEnter() {
                            elemAnim.classList.add('active');
                        },
                    }
                });
            });

            $('.swiper-club').marquee({
                duration: 12000,
                duplicated: true,
                pauseOnHover: true,
                gap: 0,
                startVisible: true
            });

        } else {
            //[...document.querySelectorAll('.content__title[data-splitting][data-effect1]')].forEach(title => {
            //    const words = [...title.querySelectorAll('.word')];

            //    for (const word of words) {

            //        const chars = word.querySelectorAll('.char');
            //        const charsTotal = chars.length;

            //        gsap.fromTo(chars, {
            //            'will-change': 'transform, filter',
            //            transformOrigin: '50% 100%',
            //            scale: position => {
            //                const factor = position < Math.ceil(charsTotal / 2) ? position : Math.ceil(charsTotal / 2) - Math.abs(Math.floor(charsTotal / 2) - position) - 1;
            //                return gsap.utils.mapRange(0, Math.ceil(charsTotal / 2), 0.5, 2.1, factor);
            //            },
            //            y: position => {
            //                const factor = position < Math.ceil(charsTotal / 2) ? position : Math.ceil(charsTotal / 2) - Math.abs(Math.floor(charsTotal / 2) - position) - 1;
            //                return gsap.utils.mapRange(0, Math.ceil(charsTotal / 2), 0, 60, factor);
            //            },
            //            rotation: position => {
            //                const factor = position < Math.ceil(charsTotal / 2) ? position : Math.ceil(charsTotal / 2) - Math.abs(Math.floor(charsTotal / 2) - position) - 1;
            //                return position < charsTotal / 2 ? gsap.utils.mapRange(0, Math.ceil(charsTotal / 2), -4, 0, factor) : gsap.utils.mapRange(0, Math.ceil(charsTotal / 2), 0, 4, factor);
            //            },
            //            filter: 'blur(12px) opacity(0)',
            //        }, {
            //            ease: 'power2.inOut',
            //            y: 0,
            //            rotation: 0,
            //            scale: 1,
            //            filter: 'blur(0px) opacity(1)',
            //            duration: 1.2,

            //            stagger: {
            //                amount: 0.15,
            //                from: 'center'
            //            }
            //        });

            //    }
            //});


            let windowHeight = window.innerHeight;


            const elemFade = gsap.utils.toArray('.fade-inup');
            elemFade.forEach((elemAnim) => {
                gsap.from(elemAnim, {
                    scrollTrigger: {
                        start: 'center bottom',
                        end: 'bottom top',
                        trigger: elemAnim,
                        onEnter() {
                            elemAnim.classList.add('active');
                        },
                    }
                });
            });


        }
    },


};

function scrollToId(id) {
    $("html, body").animate({scrollTop: $('#' + id).offset().top}, 400);
}

function scrollToObj(obj, top) {
    $("html, body").animate({scrollTop: obj.offset().top - top}, 400);
}
var Home = {
    w: window.innerWidth,
    options: {
    },
    init: function (o) {
        let me = this;
        if (o) me.options = $.extend(me.options, o);
        if (me.w > 768) {
            me.initWebSlide();
        }
        RestaurantDetail.init();
    },
    initWebSlide: function (o) {
        let me = this;
        let arrImages = [];
        for (let i = 1; i <= 119; i++) {
            let source = storageDomain + "/Data/images/home/TuDo_" + zeroPad(i, 1) + ".webp";
            arrImages.push(source);
            $('#div-test').append('<img src="' + source + '">');
        }
      
        // TweenMax can tween any property of any object. We use this object to cycle through the array
        let obj = { curImg: 0 };

        // init controller
        let controller = new ScrollMagic.Controller();
        // create tween
        let tween = TweenMax.to(obj, 1,
            {
                curImg: arrImages.length - 1,	// animate propery curImg to number of images
                roundProps: "curImg",				// only integers so it can be used as an array index
                repeat: 0,									// repeat 3 times
                immediateRender: true,			// load first image automatically
                ease: Linear.easeNone,			// show every image the sam ammount of time
                onUpdate: function () {
                    $("#myimg").attr("src", arrImages[obj.curImg]); // set the image source
                }
            }
        );

        $.each($('.text-block .text'), function (i, v) {
            let id = 'txtBlock-' + i;
            $(v).attr('id', id);
            // build a scene
            let sceneText = new ScrollMagic.Scene({
                triggerElement: '#' + id,
                triggerHook: 1,
                duration: '100%',
                reversed: true,
                yoyo: true,
            })
                .setClassToggle('#' + id, 'active')
                // .setTween(tweenText) // trigger a TweenMax.to tween
                // .addIndicators() // add indicators (requires plugin)
                .addTo(controller);
        });


        // build scene
        let scene = new ScrollMagic.Scene({
            triggerElement: "#trigger",
            triggerHook: 0,
            duration: 2600,
        })
            .setTween(tween)
            .addTo(controller);

        // pin scene
        let scene2 = new ScrollMagic.Scene({
            triggerElement: '#imagesequence',
            triggerHook: 0,
            // scene duration
            duration: 2600,
            reverse: true
        })
            .setPin('#imagesequence')
            // .addIndicators() // add indicators (requires plugin)
            .addTo(controller);


        function zeroPad(num, places) {
            let zero = places - num.toString().length + 1;
            return Array(+(zero > 0 && zero)).join("0") + num;
        }



        
    },
}
var CartAction = {
    windowW: $(window).width(),
    init: function () {
        var me = this;
        $(".cart-btn").off('click').on("click", function () {
            me.openPopupCart();
        });
        CartAction.updateCartInfo();
    },
    openPopupCart: function () {
        var me = this;
        let arrCart = Ultis.getCart();
        bindHtmlListProductCart(arrCart);
        // Fancy Box Popup Detail
        if (me.windowW > 800) {
            $.fancybox.open({
                src: '#popup-menu-atc',
                type: 'inline',
                opts: {
                    protect: true,
                    animationDuration: 500,
                    // animationEffect: 'fade-in',
                    touch: false,

                    beforeShow: function () {
                        $('body').addClass('popup-active');
                    },
                    afterShow: function () {
                    },
                    afterClose: function () {
                        $('body').removeClass('popup-active');
                    }
                },
            });
        } else {
            $.fancybox.open({
                src: '#popup-menu-atc',
                type: 'inline',
                opts: {
                    protect: true,
                    animationDuration: 500,
                    animationEffect: 'slide-in-out',
                    touch: false,
                    clickSlide: false,
                    clickOutside: false,
                    beforeShow: function () {
                        $('body').addClass('popup-active');
                    },
                    afterShow: function () {
                    },
                    afterClose: function () {
                        $('body').removeClass('popup-active');
                    }
                },
            });
        }
        bindClickPopupCart();
        FormatHtml.init();
        function bindHtmlListProductCart(arrCart) {
            let htmlCartData = "";
            $.each(arrCart, function (i, v) {
                //console.log(v);
                let totalPriceProduct = (v.price * v.quantity)
                htmlCartData += `<li data-id="${v.proid}" data-index="${i}" id="item-${i}">
                                    <div class="food-item">
                                        <div class="info-food">
                                            <div class ="name">${v.proname}</div>
                                            <div class ="price-ori" rel="currency">${v.price}</div>
                                        </div>
                                        <div class="quantity">
                                            <div class="number-order">
                                                <div class ="minus minusCart">
                                                    <svg width="24" height="25" viewBox="0 0 24 25" fill="none"
                                                        xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M17 11.5H7C6.447 11.5 6 11.947 6 12.5C6 13.053 6.447 13.5 7 13.5H17C17.553 13.5 18 13.053 18 12.5C18 11.947 17.553 11.5 17 11.5Z"
                                                            fill="#666666">
                                                        </path>
                                                    </svg>

                                                </div>
                                                <input type="number" class ="popup-cart-quantity" value="${v.quantity}">
                                                <div class ="plus plusCart">
                                                    <svg width="24" height="25" viewBox="0 0 24 25" fill="none"
                                                        xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M17 11.5H13V7.5C13 6.947 12.553 6.5 12 6.5C11.447 6.5 11 6.947 11 7.5V11.5H7C6.447 11.5 6 11.947 6 12.5C6 13.053 6.447 13.5 7 13.5H11V17.5C11 18.053 11.447 18.5 12 18.5C12.553 18.5 13 18.053 13 17.5V13.5H17C17.553 13.5 18 13.053 18 12.5C18 11.947 17.553 11.5 17 11.5Z"
                                                            fill="#666666">
                                                        </path>
                                                    </svg>

                                                </div>
                                            </div>
                                        </div>
                                        <div class="right-food">
                                            <div class ="price-after" rel="currency">${totalPriceProduct} </div>
                                            <a href="javascript:;" class="remove-food">
                                                <svg width="10" height="11" viewBox="0 0 10 11" fill="none"
                                                    xmlns="http://www.w3.org/2000/svg">
                                                    <g opacity="0.5">
                                                        <path d="M9.1875 1.3125C8.9375 1.0625 8.5625 1.0625 8.3125 1.3125L5 4.625L1.6875 1.3125C1.4375 1.0625 1.0625 1.0625 0.8125 1.3125C0.5625 1.5625 0.5625 1.9375 0.8125 2.1875L4.125 5.5L0.8125 8.8125C0.5625 9.0625 0.5625 9.4375 0.8125 9.6875C0.9375 9.8125 1.0625 9.875 1.25 9.875C1.4375 9.875 1.5625 9.8125 1.6875 9.6875L5 6.375L8.3125 9.6875C8.4375 9.8125 8.625 9.875 8.75 9.875C8.875 9.875 9.0625 9.8125 9.1875 9.6875C9.4375 9.4375 9.4375 9.0625 9.1875 8.8125L5.875 5.5L9.1875 2.1875C9.4375 1.9375 9.4375 1.5625 9.1875 1.3125Z"
                                                            fill="#666666" />
                                                    </g>
                                                </svg>

                                            </a>
                                        </div>
                                    </div>
                                </li>`;
            });

            $('#list-order-cart').html(htmlCartData);
        };
        function bindClickPopupCart() {
            $('.minusCart').off('click').click(function () {
                let $input = $(this).parent().find('input');
                let count = parseInt($input.val()) - 1;
                count = count < 1 ? 1 : count;
                $input.val(count);
                $input.change();
                index = $(this).closest("li").data("index");
                me.calculateArrayCart(index);
                return false;
            });
            $('.plusCart').off('click').click(function () {
                let $input = $(this).parent().find('input');
                $input.val(parseInt($input.val()) + 1);
                $input.change();
                index = $(this).closest("li").data("index");
                me.calculateArrayCart(index);
                return false;
            });
            $(".popup-cart-quantity").off('input').on("input", function () {
                index = $(this).closest("li").data("index");
                me.calculateArrayCart(index);
            });
            $('.remove-food').off('click').click(function () {
                var $this = $(this);
                index = $(this).closest("li").data("index");
                let arrCartCookie = Ultis.getLocalStorage(localArrCart);
                let arr = [];
                if (arrCartCookie.length > 2) {
                    try {
                        arr = JSON.parse(arrCartCookie);
                    } catch (e) {
                        arr = [];
                    }
                }
                let product = arr.splice(index, 1);
                Ultis.setLocalStorage(localArrCart, JSON.stringify(arr), 365);
                $this.closest('li').remove();
                me.updateCartInfo();
            });//xoa mon an trong gio hang
            $('#clear-all-cart').off('click').click(function () {
                let arr = [];
                Ultis.setLocalStorage(localArrCart, JSON.stringify(arr), 365);
                $("#list-order-cart").html("");

                me.updateCartInfo();
            });

            $(".save-btn").off('click').on('click', function () {
                let element = document.getElementById("html-content-holder-cart");
                html2canvas(element, {
                    scrollX: -window.scrollX,
                    scrollY: -window.scrollY,
                    windowWidth: document.documentElement.offsetWidth,
                    windowHeight: document.documentElement.offsetHeight,
                }).then(function (canvas) {
                    var image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
                        var a = document.createElement("a");
                        a.href = image;
                        a.download = "savebill.jpg";
                        a.click();
                });
            });
        };
    },
    calculateArrayCart: function (index) {
        var me = this;
        let arrCart = Ultis.getCart();
        let quantity = $("#item-" + index).find(".popup-cart-quantity").val(); //lay so luong moi 
        arrCart[index].quantity = quantity; // set so luong moi
        let proPrice = arrCart[index].price;
        let totalPriceNew = quantity * proPrice; // gia tong cua mon an moi
        arrCart[index].totalprice = totalPriceNew; // set so luong moi
        $("#item-" + index).find(".price-after").html(totalPriceNew);


        if (arrCart.length == 0) {
            Ultis.setCartExpired();
        }
        Ultis.setLocalStorage(localArrCart, JSON.stringify(arrCart), 365);

        me.updateCartInfo();
        FormatHtml.init();
    },
    updateCartInfo: function () {
        var me = this;
        let arrCart = Ultis.getCart();
        if (arrCart.length > 0) {
            $(".cart-btn").addClass("active");
        } else {
            $(".cart-btn").removeClass("active");
        }
        let totalPrice = 0;
        let totalQuantity = 0;
        for (let i = 0; i < arrCart.length; i++) {
            totalPrice += arrCart[i].totalprice;
            totalQuantity += parseInt(arrCart[i].quantity);
        }

        $("#menulist-cart-quantity").html(totalQuantity);
        $("#menulist-cart-total").html(totalPrice);
        $("#total-price-array-cart").html(totalPrice);
        FormatHtml.init();
    },
}
var BookingSuccess = {
    init: function () {
        var me = this;
        
        var dataBill = localStorage.getItem(localFinishBill);
       
        let arrData = [];
        if (dataBill.length > 0) {
            try {
                arrData = JSON.parse(dataBill);
            }
            catch (e) {
                arrData = [];
            }
        }
        $("#txtBookingSuccessBillId").html(arrData.billId);
        $("#txtBookingSuccessName").html(arrData.name);
        $("#txtBookingSuccessPhone").html(arrData.phone);
        $("#txtBookingSuccessPhoneContact").html(arrData.phone);
        $("#txtBookingSuccessResName").html(arrData.resname);
        $("#txtBookingSuccessTotalCus").html(arrData.totalCus + "&nbsp; khách");

        if (arrData.vou == "Chọn ưu đãi") {
            $("#txtBookingSuccessVouName").html("Không có ưu đãi được chọn");
        } else {
            $("#txtBookingSuccessVouName").html(arrData.vou);
        }
        let day = "";
        switch (arrData.dayCome) {
            case 0:
                day = "CN";
                break;
            case 1:
                day = "T2";
                break;
            case 2:
                day = "T3";
                break;
            case 3:
                day = "T4";
                break;
            case 4:
                day = "T5";
                break;
            case 5:
                day = "T6";
                break;
            case 6:
                day = "T7";
                break;
            default:
                day = "___";
                break;
        }

        $("#txtBookingSuccessDateTime").html(arrData.timeCome + "&nbsp;-&nbsp;" + day + "&nbsp;-&nbsp;" + moment(arrData.dateCome).format("DD/MM/YYYY"));

        $("#save-bill").off('click').on('click', function () {
            $("#html-content-holder-bill").addClass("booking-save");
            html2canvas(document.getElementById("html-content-holder-bill"), {
                useCORS: true,
                allowTaint: true,
            }).then(function (canvas) {
                var image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
                var a = document.createElement("a");
                a.href = image;
                a.download = "savebill.jpg";
                a.click();
            });
            $("#html-content-holder-bill").removeClass("booking-save");
        });
    },
}
var Contact = {
    windowW: $(window).width(),
    options: {
        lstCategory: [],
    },
    init: function (o) {
        let me = this;
        if (o) me.options = $.extend(me.options, o);

        if (me.windowW > 800) {
            let swiperMenuBranch = new Swiper(".menu__branch-list", {
                slidesPerView: 'auto',
                spaceBetween: 20,
                freeMode: true,
                loop: false,
                navigation: {
                    nextEl: ".tagBox .swiper-button-next",
                    prevEl: ".tagBox .swiper-button-prev"
                }
            });
        }

        $('.js-branch-item').each(function () {
            $(this).off('click').click(function () {
                $(".tags-filter").removeClass("active");
                $(this).addClass("active");
                var brandId = $(this).data("id");
                //console.log(brandId);
                me.getListProductByCateId(brandId);
            })
        });
        $('.js-branch-item').first().trigger('click');

        $('.contact-submit-data').off('click').click(function () {
            $("#contact-chk-name").removeClass("wrong");
            $("#contact-chk-email").removeClass("wrong");
            $("#contact-chk-phone").removeClass("wrong");
            $("#contact-chk-title").removeClass("wrong");
            $("#contact-chk-detail").removeClass("wrong");
            $(".warning").html("");

            let chkFlag = true
            if ($("#contact-fullname").val() == "") {
                $("#contact-chk-name").find(".warning").html("Vui lòng nhập tên của bạn");
                $("#contact-chk-name").addClass("wrong");
                chkFlag = false;
            }
            if ($("#contact-email").val() == "") {
                $("#contact-chk-email").find(".warning").html("Vui lòng nhập email");
                $("#contact-chk-email").addClass("wrong");
                chkFlag = false;
            }

            if ($("#contact-phone").val() == "") {
                //$("#contact-chk-phone").find(".warning").html("Vui lòng nhập số điện thoại của bạn");
                //$("#contact-chk-phone").addClass("wrong");
                //chkFlag = false;
            } else {
                if ($("#contact-phone").val().length != 10 || $("#contact-phone").val().charAt(0) != "0") {
                    $("#contact-chk-phone").find(".warning").html("Vui lòng nhập đúng số điện thoại");
                    $("#contact-chk-phone").addClass("wrong");
                    chkFlag = false;
                }
            }
            if ($("#contact-title").val() == "") {
                $("#contact-chk-title").find(".warning").html("Vui lòng nhập tiêu đề");
                $("#contact-chk-title").addClass("wrong");
                chkFlag = false;
            }
            if ($("#contact-detail").val() == "") {
                $("#contact-chk-detail").find(".warning").html("Vui lòng nhập nội dung");
                $("#contact-chk-detail").addClass("wrong");
                chkFlag = false;
            }

            if (chkFlag == true) {
                //console.log();
                //return;
                me.submitForm();
            } else {
                return;
            }
        });
    },
    getListProductByCateId: function (id) {

        $('#log').val(1);
        $.ajax({
            url: apiDomain + "/guest.htm",
            data: {
                m: 'get-contact-cate',
                dataTypeContentId: id, // test với Id phòng ban Kế Toán
            },
            crossDomain: true,
            dataType: 'jsonp',
            type: "POST",
            beforeSend: function () {
            },
            success: function (rs) {
                console.log(rs);
                if (rs.Success) {
                    if (rs.Data) {
                        $('.brand-name').html(rs.Data.DataTypeContentName);
                        $('.brand-add').html(rs.Data.DataTypeContentString);
                        $('.brand-email').html(rs.Data.DataTypeContentString1);
                        $('.brand-phone').html(rs.Data.DataTypeContentString2);
                    } else {
                        alert("Không có dữ liệu");
                    }
                }
            }
        });
    },
    submitForm: function () {
        var me = this;
        var $activeItem = $('.js-branch-item.active');
        //console.log($activeItem.data('id'));
        //console.log($activeItem.text());
        //return;
        Authen.init(function (au) {
            $.ajax({
                url: apiDomain + "/bill.htm",
                data: {
                    m: 'contact',
                    au: au,
                    fullname: $('#contact-fullname').val(),
                    email: $('#contact-email').val(),
                    phone: $('#contact-phone').val(),
                    title: $('#contact-title').val(),
                    detail: $('#contact-detail').val(),
                    dataTypeContentId: $activeItem.data('id'),
                    dataTypeContentName: $activeItem.text(),
                },
                crossDomain: true,
                dataType: 'json',
                type: "POST",
                beforeSend: function () {
                    $(".td-content__wrapper").addClass("td-loading");
                },
                success: function (xhr) {
                    console.log('-----------------------------<submit-contact>-------------------------------');
                    console.log(xhr);
                    //return;
                    if (xhr.Success) {
                        setTimeout(function () {
                            $('.td-content__wrapper').removeClass("td-loading")
                            $(".cc-left").remove();
                            $(".cc-right").remove();
                            $(".contact-success").removeClass("hid");
                        }, 1500);
                    } else {
                        alert(xhr.Message);
                    }
                }
            });
        });
    },
}
var NewsList = {
    w: window.innerWidth,
    optionsList: {
        pIndex: 1,
        pSize: 10,
        cateId: 0,
        excludeId: 0,
    },
    init: function (o) {
        let me = this;
        if (o) me.optionsList = $.extend(me.optionsList, o);

        if (me.optionsList.cateId == 0) {
            me.optionsList.cateId = 1017;
        } else {
            $(".new-cate").removeClass("active");
            $("#new-cate-" + me.optionsList.cateId).addClass("active");
        }
        me.getListByCateId();
    },
    getListByCateId: function () {
        var me = this;
        let arrPro = [];
        let htm = '';
        $('#log').val(1);
        $.ajax({
            url: apiDomain + "/news.htm",
            data: {
                m: 'get-list-news',
                pIndex: me.optionsList.pIndex,
                pSize: me.optionsList.pSize,
                cateId: me.optionsList.cateId,
            },
            crossDomain: true,
            dataType: 'jsonp',
            type: "POST",
            beforeSend: function () {
            },
            success: function (rs) {
                if (rs.Success) {
                    //console.log(rs.Total);

                    me.bindNewsListHtml(rs.Data, rs.Total);
                }
            }
        });
    },
    bindNewsListHtml: function (lstData, total) {
        var me = this;
        let htmlHotNews = "";
        let htmlLstNews = "";
        $.each(lstData, function (i, v) {
            if (i == 0) {
                htmlHotNews = `
                    <a href="${v.LinkDetail}" class ="hotnews-thumb">
                        <i>
                            <img src="${v.AvatarThumbMedium}"/>
                        </i>
                    </a>
                    <div class="hotnews-info">
                        <h2>
                            <a href="${v.LinkDetail}" class ="info-title" >${v.Title}</a>
                        </h2>
                        <a  href="${v.LinkDetail}" class="btn-clickhere">
                            <span class="icn">
                                <img src="/Static/web_images/rightarrow-icon.png" class="ico-rightarrow" />
                            </span>
                            <span class="txt">XEM NGAY</span>
                        </a>
                    </div>`;
            } else {
                htmlLstNews += `<div class="grid-news-item">
                        <div class="item-thumb">
                            <a href="${v.LinkDetail}" class ="thumb-link">
                               <img src="${v.AvatarThumbMedium}" />
                            </a>
                        </div>
                        <div class="item-info">
                            <div class ="title">
                                <a href="${v.LinkDetail}">${v.Title}</a>
                            </div>
                            <a href="${v.LinkDetail}" class="btn-clickhere" title="Xem Ngay">
                                <span class="icn">
                                    <img src="/Static/web_images/rightarrow-icon.png" class="ico-rightarrow" />
                                </span>
                                <span class="txt">XEM NGAY</span>
                            </a>
                        </div>
                    </div>`;
            }
        });
        $('#box-new-hot').html(htmlHotNews);
        $('#box-news').html(htmlLstNews);
        $(".news-content.widthCT").removeClass("td-loading");

        me.chkStatusPaging(total);
        me.formatClickEvent();
    },
    formatClickEvent: function (lstData) {
        var me = this;
        //ddl
        me.funcPagingNews();

        $('.btnPrev').off('click').click(function () {
            if ($(this).hasClass("active")) {
                me.optionsList.pIndex -= 1;
                console.log(me.optionsList.pIndex);
                me.getListByCateId();

            }
        });
        $('.btnNext').off('click').click(function () {
            if ($(this).hasClass("active")) {
                me.optionsList.pIndex += 1;
                console.log(me.optionsList.pIndex);
                me.getListByCateId();
            }
        });

        $('.tags-filter').each(function () {
            $(this).off('click').click(function () {
                $(".tags-filter").removeClass("active");
                $(this).addClass("active");
                var cateid = $(this).data("cateid");
                me.optionsList.cateId = cateid;
                me.optionsList.pIndex = 1;
                me.getListByCateId();
            })
        });
    },
    funcPagingNews: function () {
        var me = this;
        // co so 
        $('#boxNewsPaging .btnDropdown').off('click').click(function () {
            if ($('#boxNewsPaging').hasClass('active')) {
                $('#boxNewsPaging').removeClass('active');
            } else {
                $('#boxNewsPaging').addClass('active');
            }
        });
        $('#boxNewsPaging .pick-page').off('click').click(function () {
            let paging = $(this).data("paging");
            $("#paging-name").html(paging);
            $('#boxNewsPaging').removeClass('active');
            me.optionsList.pIndex = paging;
            me.getListByCateId();
        });

        $(document).on('click', function (e) {
            if ($(e.target).closest($('#boxNewsPaging')).length === 0) {
                $('#boxNewsPaging').removeClass('active');
            }
        });
    },
    chkStatusPaging: function (total) {
        var me = this;
        //console.log(totalPage);
        //check class btnPagination
        let totalPage = Math.ceil(total / me.optionsList.pSize);
        if (totalPage == 1) {
            $(".btnPrev").removeClass("active");
            $(".btnNext").removeClass("active");
        } else {
            if (me.optionsList.pIndex == 1) {
                $(".btnPrev").removeClass("active");
                $(".btnNext").addClass("active");
            } else if (me.optionsList.pIndex == totalPage) {
                $(".btnPrev").addClass("active");
                $(".btnNext").removeClass("active");
            } else {
                $(".btnPrev").addClass("active");
                $(".btnNext").addClass("active");
            }
        }
        //bind ddl paging
        let htmlDdlPaging = "";
        for (let i = 1; i <= totalPage; i++) {
            htmlDdlPaging += `<li class="page-item">
                                <a href="javascript:;" data-paging="${i}" class ="pick-page">${i}</a>
                            </li>`;
        }
        $('#newsPaging').html(htmlDdlPaging);
        $("#paging-name").html(me.optionsList.pIndex);
    },

}
var NewsDetail = {
    w: window.innerWidth,
    options: {
        totalStar: 3,
    },
    init: function (o) {
        let me = this;
        if (o) me.options = $.extend(me.options, o);
        me.initStar();
    },
    initStar: function () {
        let me = this;
        //console.log(me.options);
        let seoStar = $('#news-review');
        seoStar.addClass(Ultis.getClassSeoStar(me.options.totalStar));
        seoStar.find('.txt').html(`${me.options.totalStar}/5`);
    },
}
var BookingManager = {
    windowW: $(window).width(),
    option: {
        parentPromotion: 4,
        wraptSelect: "select-timeBox",
        timeBegin: "09:30 AM",
        timeEnd: "10:30 PM",
        stepTimeOption: 30,
        totalMinuteFromNow: 30,
    },
    init: function () {
        var me = this;

        if (me.windowW > 800) {
            // Fancy Box Popup Detail
            $('.bookingPopup').off('click').click(function () {
                $.fancybox.close();
                me.clearForm();
                //return;
                let resId = $(this).data("resid");
                let timeout = 0;
                if ($(this).hasClass("btnInCart")) {
                    timeout = 800;
                }
                Ultis.funcDate(function (obj) {
                    setTimeout(function () {
                        $.fancybox.open({
                            src: '#popup-booking-atc',
                            type: 'inline',
                            opts: {
                                protect: true,
                                animationDuration: 500,
                                // animationEffect: 'fade-in',
                                touch: false,
                                clickSlide: false,
                                clickOutside: false,
                                beforeShow: function () {
                                    $("#txtResId").val("");
                                    $("#txtResName").html("Lựa chọn cơ sở");
                                    //if (resId > 0) {
                                    //} else {
                                    //    $("#txtResName").html("Lựa chọn cơ sở");
                                    //}
                                    $('body').addClass('popup-active');
                                },
                                afterShow: function () {
                                    me.bindDdlFormBooking(resId);
                                },
                                afterClose: function () {
                                    $('body').removeClass('popup-active');
                                }
                            },
                        });
                    }, timeout);
                });
            });
            $('.open-fancy-warning').off('click').click(function () {
                $.fancybox.open({
                    src: '#popup-warning',
                    type: 'inline',
                    opts: {
                        protect: true,
                        animationDuration: 500,
                        touch: false,
                        beforeShow: function () {
                            $('body').addClass('popup-warning-active');
                        },
                        afterShow: function () {
                        },
                        afterClose: function () {
                            $('body').removeClass('popup-warning-active');
                        }
                    },
                });
            });
            $('.Popup-warning .confirm-btn').off('click').click(function () {
                $.fancybox.close(true);
            });
        } else {
            $('.bookingPopup').off('click').click(function () {
                $.fancybox.close();
                me.clearForm();
                let resId = $(this).data("resid");
                let timeout = 0;
                if ($(this).hasClass("btnInCart")) {
                    timeout = 800;
                }
                Ultis.funcDate(function (obj) {
                    setTimeout(function () {
                        $.fancybox.open({
                            src: '#popup-booking-atc',
                            type: 'inline',
                            opts: {
                                protect: true,
                                animationDuration: 500,
                                // animationEffect: 'fade-in',
                                touch: false,
                                clickSlide: false,
                                clickOutside: false,
                                beforeShow: function () {
                                    $('body').addClass('popup-active');
                                    $("#txtResId").val("");
                                    if (resId > 0) {
                                        $("#txtResName").html("");
                                    } else {
                                        $("#txtResName").html("Lựa chọn cơ sở");
                                    }
                                },
                                afterShow: function () {
                                    me.bindDdlFormBooking(resId);
                                },
                                afterClose: function () {
                                    $('body').removeClass('popup-active');
                                }
                            },
                        });
                    }, timeout);
                });
            });
            $('.open-fancy-warning').off('click').click(function () {
                $.fancybox.open({
                    src: '#popup-warning',
                    type: 'inline',
                    opts: {
                        protect: true,
                        animationDuration: 500,
                        touch: false,
                        beforeShow: function () {
                            $('body').addClass('popup-warning-active');
                        },
                        afterShow: function () {
                        },
                        afterClose: function () {
                            $('body').removeClass('popup-warning-active');
                        }
                    },
                });
            });
            $('.Popup-warning .confirm-btn').off('click').click(function () {
                $.fancybox.close(true);
            });
        }
    },
    bindDdlFormBooking: function (resId) {
        var me = this;
        //console.log(resId);
        //bind ddl co so
        if (resId > 0) {
            $("#txtResName").html($(".ddl-resid-" + resId).data("resname"));
            $("#txtResId").val(resId);
        }
        me.formatFormBooking();
        //bind ddl gio
        //let arrOptTime = Ultis.bindTimeDropdownList(1, me.option.timeBegin, me.option.timeEnd, me.option.stepTimeOption, me.option.totalMinuteFromNow);

        //if (arrOptTime.length <= 0) {
        //    $("#txtTime").addClass("outtime");
        //    $("#boxTime").addClass("outtime-background");
        //    $("#txtTime").html("Hết giờ");
        //    $("#txtValueTime").val("outtime");
        //    $('#boxTime .dropdown-btn').off('click');
        //} else {
        //    $("#txtTime").removeClass("outtime");
        //    $("#boxTime").removeClass("outtime-background");
        //    for (let i = 0; i < arrOptTime.length; i++) {
        //        $(`#${me.option.wraptSelect}`).append(`<li><a href="javascript:;" data-value="${arrOptTime[i]}" class ="slt-btn time-change">${arrOptTime[i]}</a></li>`);
        //        if (i == 0) {
        //            $("#txtTime").html(arrOptTime[i]);
        //            $("#txtValueTime").val(arrOptTime[i]);
        //        }
        //        $("#chk-time").removeClass("wrong");
        //        Ultis.funcTime();
        //    }
        //}
        me.formatFormBooking();
        //bind ddl uudai
        $('#log').val(1);
        $.ajax({
            url: apiDomain + "/get-product-home.htm",
            data: {
                m: 'get-promotion-for-booking',
                parent: me.option.parentPromotion,
            },
            crossDomain: true,
            dataType: 'jsonp',
            type: "POST",
            beforeSend: function () {
            },
            success: function (rs) {
                if (rs.Success) {
                    let htmlLstVou = "";
                    $.each(rs.Data, function (i, v) {
                        htmlLstVou += `<li>
                                           <a href="javascript:;" class ="slt-btn vou-change" data-value="${v.value}">${v.key}</a>
                                       </li>`;
                    });
                    $('#lstVou').html(htmlLstVou);
                    $('#droplist-ct-vou').removeClass("td-loading");
                    me.formatFormBooking();
                }
            }
        });
    },
    formatFormBooking: function () {
        var me = this;

        Ultis.funcVou();
        Ultis.funcCoso();
        // tang giam so luong
        $('.minus').off('click').click(function () {
            let $input = $(this).parent().find('input');
            let count = parseInt($input.val()) - 1;
            count = count < 1 ? 1 : count;
            $input.val(count);
            $input.change();
            return false;
        });
        $('.plus').off('click').click(function () {
            let $input = $(this).parent().find('input');
            $input.val(parseInt($input.val()) + 1);
            $input.change();
            return false;
        });
        //click submitForm
        $('.jsSubmitBooking').off('click').click(function () {
            me.clearForm();
            let chkFlag = true
            if ($("#txtFullname").val() == "") {
                $("#chk-name").find(".warning").html("Vui lòng nhập tên của bạn");
                $("#chk-name").addClass("wrong");
                chkFlag = false;
            }
            if ($("#txtPhone").val() == "") {
                //$("#chk-phone").find(".warning").html("Vui lòng nhập số điện thoại của bạn");
                //$("#chk-phone").addClass("wrong");
                //chkFlag = false;
            } else {
                if ($("#txtPhone").val().length != 10 || $("#txtPhone").val().charAt(0) != "0") {
                    $("#chk-phone").find(".warning").html("Vui lòng nhập đúng số điện thoại");
                    $("#chk-phone").addClass("wrong");
                    chkFlag = false;
                }
            }
            if ($("#txtResId").val() == "") {
                $("#chk-res").find(".warning").html("Vui lòng chọn nhà hàng");
                $("#chk-res").addClass("wrong");
                chkFlag = false;
            }
            if ($("#txtValueTime").val() == "") {
                $("#chk-time").find(".warning").html("Vui lòng chọn giờ.");
                $("#chk-time").addClass("wrong");
                chkFlag = false;
            }
            if (chkFlag == true) {
                $(".book-now").hide();
                $(".btn-book-now-loading").show();
                me.submitForm();
            } else {
                return;
            }
        });
    },
    submitForm: function () {
        var me = this;

        let arrCart = Ultis.getCart();
        console.log(arrCart);
        //return;
        Authen.init(function (au) {
            $.ajax({
                url: apiDomain + "/bill.htm",
                data: {
                    m: 'booking-slot',
                    au: au,
                    cusName: $('#txtFullname').val(),
                    cusPhone: $('#txtPhone').val(),
                    resId: $('#txtResId').val(),
                    cart: JSON.stringify(arrCart),
                    totalCus: $('#txtTotalCus').val(),
                    dateCome: $("#DateCome").find("input[name*='_submit']").val(),
                    timeCome: $('#txtValueTime').val(),
                    promoId: $('#txtVouId').val(),
                    promoText: $('#txtVouName').text().trim(),
                    note: $('#txtNote').val(),
                },
                crossDomain: true,
                dataType: 'json',
                type: "POST",
                beforeSend: function () {
                },
                success: function (xhr) {
                    console.log('-----------------------------<submit-cart>-------------------------------');
                    console.log(xhr);
                    //return;
                    if (xhr.Success) {
                        //$("#bookingDateCome").pickadate('picker').get('select').day;
                        let finishBill = {
                            "billId": xhr.Data,
                            "name": $('#txtFullname').val(),
                            "phone": $('#txtPhone').val(),
                            "resname": $('#txtResName').text().trim(),
                            "dateCome": $("#DateCome").find("input[name*='_submit']").val(),
                            "dayCome": $("#bookingDateCome").pickadate('picker').get('select').day,
                            "timeCome": $('#txtTime').text().trim(),
                            "totalCus": $('#txtTotalCus').val(),
                            "vou": $('#txtVouName').text().trim(),
                            "vouId": $('#txtVouId').val(),
                        };
                        localStorage.setItem(localFinishBill, JSON.stringify(finishBill));
                        localStorage.removeItem(localArrCart);
                        window.location = '/booking-success.htm';
                        //localStorage.setItem(localBillId, xhr.ExtMessage);
                    } else {
                        alert(xhr.Message);
                    }
                }
            });
        });
    },
    clearForm: function () {
        var me = this;
        $("#chk-name").removeClass("wrong");
        $("#chk-phone").removeClass("wrong");
        $("#chk-res").removeClass("wrong");
        $("#chk-time").removeClass("wrong");
        $(".warning").html("");
    },

    bindListTime: function () {
        var me = this;
        me.clearForm();
        let chkFlag = true
        if ($("#txtResId").val() == "") {
            $("#chk-res").find(".warning").html("Vui lòng chọn nhà hàng");
            $("#chk-res").addClass("wrong");
            chkFlag = false;
        }
        let resId = $('#txtResId').val();
        let dateCome = $("#DateCome").find("input[name*='_submit']").val();

        $.ajax({
            url: apiDomain + "/get-product-home.htm",
            data:
            {
                m: 'get-slot-time',
                resId: resId,
                dateCome: dateCome,
            },
            crossDomain: true,
            dataType: 'jsonp',
            type: "POST",
            beforeSend: function () {
            },
            success: function (rs) {
                //console.log(rs);
                if (rs.Success) {
                    let allSlots = rs.ExtData;
                    let bookedSlots = rs.Data;
                    let bookedSlotIds = bookedSlots.map(slot => slot.SlotId);
                    let ulElement = document.getElementById('select-timeBox');
                    ulElement.innerHTML = '';

                    allSlots.forEach(slot => {
                        let isBooked = bookedSlotIds.includes(slot.SlotId);
                        let liElement = document.createElement('li');
                        let aElement = document.createElement('a');
                        aElement.href = "javascript:;";
                        aElement.setAttribute('data-value', slot.Value);
                        if (isBooked) {
                            aElement.classList.add('slt-btn', 'disabled'); // Không thêm 'time-change'
                            aElement.innerHTML = `${slot.Label} <span>(hết bàn)</span>`;
                            aElement.style.pointerEvents = 'none'; // Chặn click
                            aElement.style.opacity = '0.5'; // Cho mờ đi nếu muốn
                        } else {
                            aElement.classList.add('slt-btn', 'time-change');
                            aElement.textContent = slot.Label;
                        }

                        liElement.appendChild(aElement);
                        ulElement.appendChild(liElement);
                    });

                    //console.log('aaaaa');

                    setTimeout(function () {
                        $('#select-timeBox').find('li:first > a').trigger('click');
                        //console.log('trigger click');
                    }, 200);

                    

                    Ultis.funcTime();
                }
            }
        });
    }
}
var RestaurantList = {
    options: {
    },
    init: function (o) {
        let me = this;
        if (o) me.options = $.extend(me.options, o);
        me.initResToDistrict();

        me.initClickMenuBindProduct();
    },
    initResToDistrict: function () {
        let me = this;
        $.each($('.item-res'), function (i, v) {
            let districid = $(v).data("districid");
            bindStatusNotiRes(v);
            $(v).appendTo('#wraptDistrict-' + districid);
        });

        // call swiper cho mob
        setTimeout(function () {

        }, 1000);

        function bindStatusNotiRes(v) {
          
            let districid = $(v).data("districid");
            let resfullslot = $(v).data("resfullslot");
            let timeopen = moment($(v).data("timeopen"), 'hh:mm A').format('HH:mm A');
            let timenow = moment().format('HH:mm A');
            let timeclose = moment($(v).data("timeclose"), 'hh:mm A').format('HH:mm A');

            let intTimeopen = Ultis.getTimeByHourAndMinute(timeopen);
            let intTimenow = Ultis.getTimeByHourAndMinute(timenow);
            let intTimeclose = Ultis.getTimeByHourAndMinute(timeclose);
            if ($(v).data("resid") == 2) {
                //console.log(timeopen + "---" + intTimeopen);
                //console.log(timenow + "---" + intTimenow);
                // console.log(timeclose + "---" + intTimeclose);
                //console.log(timeclose + "---" + intTimeclose);
            }
            //if (intTimeopen < intTimenow && intTimenow < intTimeclose) {
            if (intTimeopen < intTimenow) {
                if (resfullslot == 0) {
                    $(v).addClass("status-type-1");
                } else {
                    $(v).addClass("status-type-3");
                }
            } else {
                $(v).addClass("status-type-2");
            }
        };
    },
    initClickMenuBindProduct: function () {
        var me = this;
        $('.tags-filter').each(function () {
            $(this).off('click').click(function () {
                $(".tags-filter").removeClass("active");
                $(this).addClass("active");
                var districtId = $(this).data("districtid");
                //console.log(districtId);
                let arr = [];
                if (districtId == -33) {
                    $(".cc-wrapper").show();
                } else {
                    $(".cc-wrapper").hide();
                    $('#cc-wrapper' + districtId).show();
                }

                Ultis.scrollToObj($("#coso-top-ruler"), 200);
            })
        });
    },
}
var RestaurantDetail = {
    options: {
        totalStar: 3,
    },
    dataMapInput: [],
    init: function (o) {
        let me = this;
        if (o) me.options = $.extend(me.options, o);

        $.each($('.check-status-res'), function (i, v) {
            me.bindStatusNotiRes(v);
        });
        me.initStar();
        me.initResToDistrict();
    },
    initStar: function () {
        let me = this;
        //console.log(me.options);
        let seoStar = $('#csdcb-review');
        seoStar.addClass(Ultis.getClassSeoStar(me.options.totalStar));
        seoStar.find('.txt').html(`${me.options.totalStar}/5`);
    },
    initResToDistrict: function () {
        var me = this;
        $.each($('.item-res-detail '), function (i, v) {
            let districid = $(v).data("districid");
            let count = $('#wraptLeftDistrict-' + districid).data("count");
            let newcount = count + 1;
            $('#wraptLeftDistrict-' + districid).data("count", newcount);
            $('#wraptLeftDistrict-' + districid).find(".count").html(newcount);
            me.initDataMapInput($(v));
            $(v).appendTo('#ccBox-wraptDistrict-' + districid);
        });

        $.each($('.item-res-detail-mob'), function (i, v) {
            let districid = $(v).data("districid");
            let count = $('#wraptLeftDistrictMob-' + districid).data("count");
            let newcount = count + 1;
            $('#wraptLeftDistrictMob-' + districid).data("count", newcount);
            $('#wraptLeftDistrictMob-' + districid).html(newcount);
            me.initDataMapInput($(v));
            $(v).appendTo('#ccBoxMob-wraptDistrict-' + districid);
        });
        me.bindDataMapInput();
    },
    initDataMapInput: function (res) {
        var me = this;
        let resId = res.data("resid");
        let lat = res.data("lat");
        let long = res.data("long");
        me.dataMapInput.push({
            "resId": resId,
            "lat": lat,
            "long": long,
            "distance": "",
            "duration": ""
        });
    },
    bindDataMapInput: function (res) {
        var me = this;
        me.actionScrollbyClick();
        try {
            getDistanceMatrix(me.dataMapInput).then(res => {
                bindInfoMap(res);
            });
        }
        catch (err) {
            console.log(err.message);
        }

        function bindInfoMap(res) {
            console.log(res);
            $(".chkNearDistant").removeClass("hid");
            $(".branch-toggleBox").removeClass("active");
            $(".branch-filter.chkNearDistant").trigger("click");
            res.forEach(function (item) {
                $(".distance-" + item.resId).html("~" + item.distanceFix);
                $(".duration-" + item.resId).html("~" + item.durationFix);
            });
            //console.log(resIdNearDistance + "------" + resNearDistance);
            bindResNearDistance(res);
        }
        function bindResNearDistance(res) {
            if ($(window).width() > 800) {
                $(".near-distant").html(`<div class="branch-box resNearDistance"  id="ccBox-wraptDistrict-9999" data-district="9999">
                                            <div class ="label-branch">gần bạn nhẤt</div>
                                        </div>`)
            } else {
                $(".near-distant").html(`<div class="near-by resNearDistance"  id="ccBox-wraptDistrict-9999" data-district="9999">
                                            <div class ="head-text">gần bạn nhẤt</div>
                                            <div class ="branch-nbl"></div>
                                        </div>`)
            }


            //lay top 3 nha hang gan nhat
            let top3Res = res.slice(0, 3);
            //console.log(top3Res);
            for (let i = 0; i < top3Res.length; i++) {
                let htmlResNear;
                if ($(window).width() > 800) {
                    htmlResNear = $('.item-res-detail*[data-resid="' + top3Res[i].resId + '"]');
                    $(".resNearDistance").append(htmlResNear.clone());
                } else {
                    htmlResNear = $('.item-res-detail-mob*[data-resid="' + top3Res[i].resId + '"]');
                    $(".branch-nbl").append(htmlResNear.clone());
                }
                
            }

            BookingManager.init();
            me.actionScrollbyClick();
        }
    },
    bindStatusNotiRes: function (v) {
        let resfullslot = $(v).data("resfullslot");
        let timeopen = moment($(v).data("timeopen"), 'hh:mm A').format('HH:mm A');
        let timenow = moment().format('HH:mm A');
        let timeclose = moment($(v).data("timeclose"), 'hh:mm A').format('HH:mm A');

        let intTimeopen = Ultis.getTimeByHourAndMinute(timeopen);
        let intTimenow = Ultis.getTimeByHourAndMinute(timenow);
        let intTimeclose = Ultis.getTimeByHourAndMinute(timeclose);

        //console.log(timeopen + "---" + intTimeopen);
        //console.log(timenow + "---" + intTimenow);
        //console.log(timeclose + "---" + intTimeclose);
        //if (intTimeopen < intTimenow && intTimenow < intTimeclose) {
        if (intTimeopen < intTimenow) {
            if (resfullslot == 0) {
                $(v).addClass("status-type-1");
                $(v).find(".chkstatus").addClass("open");
                $(v).find(".chkstatus .txt").html("ĐANG MỞ");
            } else {
                $(v).addClass("status-type-3");
                $(v).find(".chkstatus").addClass("full");
                $(v).find(".chkstatus .txt").html("HẾT BÀN");
            }
        } else {
            $(v).addClass("status-type-2");
            $(v).find(".chkstatus").addClass("closed");
            $(v).find(".chkstatus .txt").html("ĐANG NGHỈ");
        }
    },
    actionScrollbyClick: function () {
        var me = this;
        let posTop = 0;
        $.fn.calHeightBranch = function () {
            let hBranch = $('.branch-web .branch-left').innerHeight();
            $('.branch-web .content-right').css('max-height', hBranch);
            //console.log('Height branch' + hBranch)
        }
        $.fn.calHeightBranch();

        $(window).resize(function () {
            $.fn.calHeightBranch();
        });
        $('#content-tab-1 .branch-box').each(function (i, v) {

            let districtId = $(v).data('district');
            //console.log('---------------------------------------------------');
            //console.log('districtId', districtId);
            //console.log($(v).outerHeight());
            //console.log(posTop);
            if (districtId > 0) {
                $(`#wraptLeftDistrict-${districtId}`).attr('pos', posTop);
                //$(`#wraptLeftDistrict-${districtId}`).find('.name').html($(`#wraptLeftDistrict-${districtId}`).find('.name').html() + " - " + posTop);
            }
            posTop += $(v).outerHeight();
            //console.log($(v).height());
        });
        $('.branch-filter').each(function (i, v) {
            $(v).off('click').click(function () {
                let pos = $(v).attr('pos');
                $('.branch-filter').removeClass('active');
                $(v).addClass('active');
                //console.log(pos);
                $("#content-tab-1").animate(
                    { scrollTop: pos },
                    300
                );
            });
        });

    },
}
var MenuListManager = {
    windowW: $(window).width(),
    option: {
        topShow: 3,
        productIdShowBigSize: 16,
        prefixBoxCate: 'box-cate-',
        lstCategory: [],
        activeScroll: 1,
    },
    init: function () {
        var me = this;
        $(".td-wrapper").addClass("td-menu-wrapper");
        me.getMenu();
        CartAction.init();
    },
    getMenu: function () {
        // ajax len server get arrray menu
        var me = this;
        $('#log').val(1);
        $(".list-menu-tab").html("");
        $.ajax({
            url: apiDomain + "/get-product-home.htm",
            data:
            {
                m: 'get-list-cate',
            },
            crossDomain: true,
            dataType: 'jsonp',
            type: "POST",
            beforeSend: function () {
            },
            success: function (rs) {
                //console.log(rs);
                if (rs.Success) {
                    let lstCateData = [];
                    for (var i = 0; i < rs.Data.length; i++) {
                        if (rs.Data[i].ParentCateId != 0) {
                            lstCateData.push(rs.Data[i]);
                        }
                    }
                    BindMenuHtml(lstCateData);
                }
            }
        });
        // Bind top menu html
        function BindMenuHtml(lstCategory) {
            me.option.lstCategory = lstCategory;
            //console.log(me.option.lstCategory);
            let htmlMenuCategoryList = `<div class ="swiper-slide">
                                            <a href="javascript:;" class ="tags-filter active menu-tag-box" data-id="-33">Tất cả</a>
                                        </div>`;

            if (lstCategory.length > 0) {
                $.each(lstCategory, function (i, v) {
                    htmlMenuCategoryList += `<div class ="swiper-slide">
                                    <a href="javascript:;" class ="tags-filter menu-tag-box" id="menu-list-cate-${v.CateId}" data-id="${v.CateId}">${v.CateName}</a>
                                </div>`;
                });
                $("#menu-list-category").html(htmlMenuCategoryList);

                $(".swiper-button-next").removeClass("hidden-swiperbutton");
                $(".swiper-button-prev").removeClass("hidden-swiperbutton");
                //khoi tao swiperMenu cho web
                if (me.windowW > 800) {
                    let swiperMenuTags = new Swiper(".menu__tags-list", {
                        slidesPerView: 'auto',
                        spaceBetween: 20,
                        freeMode: true,
                        loop: false,
                        navigation: {
                            nextEl: ".tagBox .swiper-button-next",
                            prevEl: ".tagBox .swiper-button-prev"
                        }
                    });
                }

                me.getMenuBox(lstCategory);
            }
        }
    },
    getMenuBox: function (lstCate) {
        var me = this;
        let htmlMenuBox = "";
        $.each(lstCate, function (i, v) {
            let classFirstMenu = "";
            if (v.CateId == me.option.productIdShowBigSize) { classFirstMenu = "combo-menu"; }
            htmlMenuBox = `<div class="menuBox pending" id="menuBox${v.CateId}" data-id="${v.CateId}">
                                <h2 class="title-menu">${v.CateName}</h2>
                                <ul class ="list-food-menu ${classFirstMenu} td-loading" id="box-cate-${v.CateId}"></ul>
                            </div>`;
            $("#menu-list-product").append(htmlMenuBox);

            if (i < 3) {
                me.getListProductByCateId(me.option.prefixBoxCate + lstCate[i].CateId, lstCate[i].CateId);
            }

        });
        me.initEventBindProduct();

    },
    getListProductByCateId: function (divId, cateId) {
        var me = this;
        //console.log('divId', divId);
        let $box = $(`#menuBox${cateId}`);
        if ($box.hasClass("pending")) {
            let arrPro = [];
            let htm = '';
            $box.removeClass('pending');
            $box.addClass('calling');
            $('#log').val(1);
            $.ajax({
                url: apiDomain + "/get-product-home.htm",
                data: {
                    m: 'get-list-product-by-cate',
                    pSize: 1000,
                    cateId: cateId
                },
                crossDomain: true,
                dataType: 'jsonp',
                type: "POST",
                beforeSend: function () {
                },
                success: function (rs) {
                    $box.removeClass('calling');
                    if (rs.Success) {
                        bindProductHtml(rs.Data);
                        CartAction.updateCartInfo();
                    }
                    // Mở lại cho phép cuộn lấy data
                    me.option.activeScroll = 1;
                    //console.log('AJJAX ---- me.option.activeScroll', me.option.activeScroll);
                }
            });
            function bindProductHtml(arrPro) {
                let htmlProduct = "";
                $.each(arrPro, function (i, v) {
                    htmlProduct += `<li class="parent-class" data-id="${v.ProId}" data-name="${v.ProName}" data-price="${v.ProOriginPrice}">
                        <div class="food-menu">
                            <a href="${v.ProLinkDetail}" class ="popupFood readyActionPopup thumb" data-id="${v.ProId}">
                                <img src="${v.ProAvatarSmall}" alt="Avatar">
                            </a>
                            <div class="info-box">
                                <a href="${v.ProLinkDetail}" class ="popupFood title-food readyActionPopup" title="Tên món ăn ở đây" data-id="${v.ProId}">
                                    ${v.ProName}
                                </a>
                                <div class ="price-food" rel="currency">
                                    ${v.ProOriginPrice}
                                </div>
                                <div class ="funcsBox">
                                    <input type="number" style="display: none;" class ="txtQuantity" value="1"/>
                                    <a href="javascript:;" class ="add-to-card ready-call-add-to-card">
                                        <span class="icn">
                                            <span class="icn-plus">
                                            <svg width="10" height="11" viewBox="0 0 10 11" fill="none"
                                                 xmlns="http://www.w3.org/2000/svg">
                                                <g clip-path="url(#clip0_176_2322)">
                                                    <path d="M9.375 4.875H5.625V1.125C5.625 0.75 5.375 0.5 5 0.5C4.625 0.5 4.375 0.75 4.375 1.125V4.875H0.625C0.25 4.875 0 5.125 0 5.5C0 5.875 0.25 6.125 0.625 6.125H4.375V9.875C4.375 10.25 4.625 10.5 5 10.5C5.375 10.5 5.625 10.25 5.625 9.875V6.125H9.375C9.75 6.125 10 5.875 10 5.5C10 5.125 9.75 4.875 9.375 4.875Z"
                                                          fill="#999999"/>
                                                </g>
                                                <defs>
                                                    <clipPath id="clip0_176_2322">
                                                        <rect width="10" height="10" fill="white"
                                                              transform="translate(0 0.5)"/>
                                                    </clipPath>
                                                </defs>
                                            </svg>

                                        </span>
                                            <span class="icn-check">
                                            <svg width="10" height="11" viewBox="0 0 10 11" fill="none"
                                                 xmlns="http://www.w3.org/2000/svg">
                                                <path d="M9.20177 2.88069L8.39931 2.07824C8.29499 1.97392 8.12541 1.97392 8.02109 2.07824L3.66268 6.43664L1.97967 4.75363C1.87535 4.64931 1.70576 4.64931 1.60144 4.75363L0.798454 5.55555C0.694135 5.65986 0.694135 5.82945 0.798454 5.93377L3.47331 8.60862C3.52573 8.66105 3.59421 8.68673 3.66268 8.68673C3.73116 8.68673 3.79964 8.66051 3.85206 8.60862L9.20177 3.25945C9.30609 3.15513 9.30609 2.98555 9.20177 2.88123V2.88069Z"
                                                      fill="#222222"/>
                                            </svg>
                                        </span>
                                        </span>
                                        <span class="txt">Đặt</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </li>`;
                });

                //console.log(cateId);
                $('#' + divId).html(htmlProduct);
                $('#' + divId).removeClass("td-loading");
                FormatHtml.init();
                ProductDetail.init();
            }
        } else {
            // Mở lại cho phép cuộn lấy data
            me.option.activeScroll = 1;
            //console.log('ELSE AJJAX ---- me.option.activeScroll', me.option.activeScroll);
        }
    },
    initEventBindProduct: function () {
        var me = this;
        $('.tags-filter').each(function () {
            $(this).off('click').click(function () {
                // Khóa tạm cuộn khi click
                me.option.activeScroll = 0;
                //console.log('CLICK ---- me.option.activeScroll', me.option.activeScroll);

                $(".tags-filter").removeClass("active");
                $(this).addClass("active");
                var cateId = $(this).data("id");
                //console.log(cateId);
                me.getListProductByCateId(me.option.prefixBoxCate + cateId, cateId);
                //let arr = [];
                if (cateId == -33) {
                    $(".menuBox").show();
                } else {
                    $(".menuBox").hide();
                    $('#menuBox' + cateId).show();
                }

                Ultis.scrollToObj($("#menulist-top-ruler"), 200);

            })
        });

        window.onscroll = function () {
            //console.log('SCOLL ---- me.option.activeScroll', me.option.activeScroll);
            if (me.option.activeScroll === 1) {
                $('.menuBox.pending').each(function () {
                    let ruler = $(this).offset().top; //xem cach voi top bao nhiu
                    var pScrollCuon = $(window).scrollTop();
                    if (pScrollCuon >= (ruler - 1500)) {
                        //console.log($(this).data("id"));
                        me.getListProductByCateId(me.option.prefixBoxCate + $(this).data("id"), $(this).data("id"));
                    }
                });
            }
        };
    },
}


var ProductDetail = {
    windowW: $(window).width(),
    init: function () {
        var me = this;
        me.getPopupDetail();
        ProductAction.actionAddCart();
    },
    getPopupDetail: function () {
        var me = this;
        // Fancy Box Popup Detail
        $(`.readyActionPopup`).each(function (i, v) {
            $(this).off('click').on("click", function (e) {
                e.preventDefault();
                let proId = $(this).data("id");
                $.ajax({
                    url: apiDomain + "/get-product-home.htm",
                    data: {
                        m: 'get-detail-product',
                        pSize: 1000,
                        proId: proId
                    },
                    crossDomain: true,
                    dataType: 'jsonp',
                    type: "POST",
                    beforeSend: function () {
                    },
                    success: function (rs) {
                        if (rs.Success) {
                            //console.log(rs);
                            BindPopupDetail(rs.Data);
                        }
                    }
                });
                me.formatPopupDetail();
            });
            $(this).removeClass('readyActionPopup');
        });

        function BindPopupDetail(data) {
            $("#popup-detail-atc").data("id", data.ProId);
            $("#popup-detail-atc").data("name", data.ProName);
            $("#popup-detail-atc").data("price", data.ProOriginPrice);
            $('#popup-detail-product-name').html(data.ProName);
            $("#popup-detail-quantity").val(1);
            let htmlSapo = "";
            htmlSapo += `${nl2br(data.ProSapo)}`;
            $('#popup-detail-product-sapo').html(htmlSapo);
            //console.log(data);
            $('#popup-detail-product-current-price').html(data.ProOriginPrice + "đ");
            //if (data.ProDiscountPrice != data.ProOriginPrice) {
            //    $('#popup-detail-product-current-price').html(data.ProDiscountPrice + "đ");
            //    $('#popup-detail-product-original-price').html(data.ProOriginPrice + "đ");
            //} else {
            //    $('#popup-detail-product-current-price').html(data.ProOriginPrice + "đ");
            //}

            //Gallery
            let htmlListGallery = "";
            let arr = [];
            if (data.ProGallery.length > 0) {
                try {
                    arr = JSON.parse(data.ProGallery);
                }
                catch (e) {
                    arr = [];
                }
            }
            //console.log(arr);
            for (let i = 0; i < arr.length; i++) {
                let v = { SrcOrigin: storageDomain + "/data/images/" + arr[i].origin, SrcThumbSmall: storageDomain + "/data/images/" + arr[i].thumb }
                htmlListGallery += `<div class ="swiper-slide">
                                        <div class ="images-food">
                                            <i class ="img-background" style = "background-image: url('${v.SrcOrigin}')" ></i>
                                        </div>
                                    </div>`;
            }
            $('#lstGalleryPopupDetail').html(htmlListGallery);
            FormatHtml.init();
            me.actionPopupDetail();
            function nl2br(str) {
                if (str != undefined) {
                    if (str.length > 0) {
                        return str.replace(/(?:\r\n|\r|\n)/g, '<br>');
                    } else {
                        return '';
                    }
                } else {
                    return '';
                }

            };
        }
    },
    actionPopupDetail: function () {
        $('#minusDetail').off('click').click(function () {
            let $input = $(this).parent().find('input');
            let count = parseInt($input.val()) - 1;
            count = count < 1 ? 1 : count;
            $input.val(count);
            $input.change();
            return false;
        });
        $('#plusDetail').off('click').click(function () {
            let $input = $(this).parent().find('input');
            $input.val(parseInt($input.val()) + 1);
            $input.change();
            return false;
        });
    },
    formatPopupDetail: function () {
        var me = this;
        if (me.windowW > 800) {
            $.fancybox.open({
                src: '#popup-detail-atc',
                type: 'inline',
                opts: {
                    protect: true,
                    animationDuration: 500,
                    // animationEffect: 'fade-in',
                    touch: false,
                    beforeShow: function () {
                        $('body').addClass('popup-active');
                    },
                    afterShow: function () {
                        swiperGallery = new Swiper(".swiper-gallery", {
                            slidesPerView: 1,
                            spaceBetween: 0,
                            pagination: {
                                el: ".galleryBox .swiper-pagination",
                                type: "fraction",
                            },
                            initialSlide: 0,
                        });
                    },
                    afterClose: function () {
                        $('body').removeClass('popup-active');
                        $("#popup-detail-atc").data("id", 0);
                        swiperGallery.destroy();
                    }
                },
            });
        } else {
            $.fancybox.open({
                src: '#popup-detail-atc',
                type: 'inline',
                opts: {
                    protect: true,
                    animationDuration: 500,
                    animationEffect: 'slide-in-out',
                    touch: false,
                    beforeShow: function () {
                        $('body').addClass('popup-active');
                    },
                    afterShow: function () {
                        swiperGallery = new Swiper(".swiper-gallery", {
                            slidesPerView: 1,
                            spaceBetween: 0,
                            pagination: {
                                el: ".galleryBox .swiper-pagination",
                                type: "fraction",
                            },
                            initialSlide: 0,
                        });


                    },
                    afterClose: function () {
                        $('body').removeClass('popup-active');
                        $("#popup-detail-atc").data("id", 0);
                        swiperGallery.destroy();
                    }
                },
            });
        }
    },
}
var ProductAction = {
    actionAddCart: function () {
        var me = this;
        $(`.ready-call-add-to-card`).each(function (i, v) {
            $(this).off('click').on("click", function () {
                let proid = $(this).closest(".parent-class").data("id");
                let quantity = $(this).closest(".parent-class").find(".txtQuantity").val();
                let proname = $(this).closest(".parent-class").data("name");
                let proprice = $(this).closest(".parent-class").data("price");
                let totalItemCartPrice = (proprice * quantity);


                let arrCartCookie = Ultis.getLocalStorage(localArrCart);
                let arr = [];
                let maxIndex = 0;
                if (arrCartCookie.length > 0) {
                    try {
                        arr = JSON.parse(arrCartCookie);
                        let m = 0;
                        for (let k = 0; k < arr.length; k++) {
                            if (arr[k].i != undefined) {
                                if (maxIndex < arr[k].i) {
                                    maxIndex = arr[k].i;
                                }
                            }
                        }
                        maxIndex++;
                    } catch (e) {
                        arr = [];
                    }
                }

                console.log(arr.length);
                if (arr.length == 0) {
                    Ultis.setCartExpired();
                }
                let chkCartIdentical = false;
                for (var i = 0; i < arr.length; i++) {
                    if (arr[i].proid == proid) {
                        chkCartIdentical = true;
                        let a = parseInt(arr[i].quantity);
                        let b = parseInt(quantity);
                        arr[i].quantity = a + b;
                        let c = arr[i].totalprice;
                        if (isNaN(c)) {
                            c = 0;
                        }
                        arr[i].totalprice = c + totalItemCartPrice;
                    }
                }
                if (chkCartIdentical == false) {
                    let product = { i: maxIndex, proid: proid, proname: proname, quantity: quantity, price: proprice, totalprice: totalItemCartPrice };
                    arr.push(product);
                }
                Ultis.setLocalStorage(localArrCart, JSON.stringify(arr), 365);
                CartAction.updateCartInfo();
                //console.log("proId:" + proId + "-----" + "quantity:" + quantity);
            });
            $(this).removeClass('ready-call-add-to-card');
        });
    },
}
var SearchManager = {
    windowW: $(window).width(),
    lstPro: [],
    init: function () {
        var me = this;
        console.log(me.getLocalStorage("searchInputNoEncrypt"));
        $("#input-search-product").val(me.getLocalStorage("searchInputNoEncrypt"));
        if (!(me.lstPro.length > 0)) {
            me.getData(function (data) {
                me.searchInArray();
            });
        } else {
            me.searchInArray();
        }
        //me.searchInit();
    },
    getData: function (callback) {
        var me = this;
        $('#log').val(1);
        $.ajax({
            url: apiDomain + "/get-product-home.htm",
            data:
            {
                m: 'get-list-product',
            },
            crossDomain: true,
            dataType: 'jsonp',
            type: "POST",
            beforeSend: function () {
            },
            success: function (rs) {
                me.lstPro = JSON.stringify(rs.Data);
                (typeof callback != 'undefined') ? callback(rs.Data) : {};
            }
        });
    },
    searchInArray: function () {
        var me = this;
        $(".bh-menu-list").html("");
        let keyword = $("#input-search-product").val();
        let lstProductByKeyword = [];
        let lstProduct = me.lstPro
        let arr = [];
        if (lstProduct.length > 0) {
            try {
                arr = JSON.parse(lstProduct);
            } catch (e) {
                arr = [];
            }
        } else {
            alert("khong co mon an trong list");
            return;
        }
        let result = "";
        for (let i = 0; i < arr.length; i++) {
            let keyNonUnicode = UnicodeToKoDau(keyword).toLowerCase();
            let sampleNonunicode = UnicodeToKoDau(arr[i].ProName).toLowerCase();
            if (sampleNonunicode.indexOf(keyNonUnicode) >= 0) {
                lstProductByKeyword.push(arr[i]);
            }
        }

        me.bindDataBySearch(lstProductByKeyword);

        function UnicodeToKoDau(s) {
            var uniChars = "àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệđìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵÀÁẢÃẠÂẦẤẨẪẬĂẰẮẲẴẶÈÉẺẼẸÊỀẾỂỄỆĐÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴÂĂĐÔƠƯ";
            var KoDauChars = "aaaaaaaaaaaaaaaaaeeeeeeeeeeediiiiiooooooooooooooooouuuuuuuuuuuyyyyyAAAAAAAAAAAAAAAAAEEEEEEEEEEEDIIIOOOOOOOOOOOOOOOOOOOUUUUUUUUUUUYYYYYAADOOU";
            var retVal = "", pos = 0; for (var i = 0; i < s.length; i++) { pos = uniChars.indexOf(s.charAt(i)); if (pos >= 0) { retVal += KoDauChars.charAt(pos); } else { retVal += s.charAt(i); } }
            return retVal;
        }
    },
    bindDataBySearch: function (lst) {
        var me = this;
        console.log(lst);

        let htmlProduct = "";
        $.each(lst, function (i, v) {
            htmlProduct += `<li class="parent-class" data-id="${v.ProId}" data-name="${v.ProName}" data-price="${v.ProOriginPrice}">
                        <div class="food-menu">
                            <a href="${v.ProLinkDetail}" class ="popupFood readyActionPopup thumb" data-id="${v.ProId}">
                                <img src="${v.ProAvatarSmall}" alt="Avatar">
                            </a>
                            <div class="info-box">
                                <a href="${v.ProLinkDetail}" class ="popupFood title-food readyActionPopup" title="Tên món ăn ở đây" data-id="${v.ProId}">
                                    ${v.ProName}
                                </a>
                                <div class ="price-food" rel="currency">
                                    ${v.ProOriginPrice}
                                </div>
                                <div class ="funcsBox">
                                <input type="number" style="display: none;" class ="txtQuantity" value="1"/>
                                    <a href="javascript:;" class ="add-to-card ready-call-add-to-card">
                                        <span class="icn">
                                            <span class="icn-plus">
                                            <svg width="10" height="11" viewBox="0 0 10 11" fill="none"
                                                 xmlns="http://www.w3.org/2000/svg">
                                                <g clip-path="url(#clip0_176_2322)">
                                                    <path d="M9.375 4.875H5.625V1.125C5.625 0.75 5.375 0.5 5 0.5C4.625 0.5 4.375 0.75 4.375 1.125V4.875H0.625C0.25 4.875 0 5.125 0 5.5C0 5.875 0.25 6.125 0.625 6.125H4.375V9.875C4.375 10.25 4.625 10.5 5 10.5C5.375 10.5 5.625 10.25 5.625 9.875V6.125H9.375C9.75 6.125 10 5.875 10 5.5C10 5.125 9.75 4.875 9.375 4.875Z"
                                                          fill="#999999"/>
                                                </g>
                                                <defs>
                                                    <clipPath id="clip0_176_2322">
                                                        <rect width="10" height="10" fill="white"
                                                              transform="translate(0 0.5)"/>
                                                    </clipPath>
                                                </defs>
                                            </svg>

                                        </span>
                                            <span class="icn-check">
                                            <svg width="10" height="11" viewBox="0 0 10 11" fill="none"
                                                 xmlns="http://www.w3.org/2000/svg">
                                                <path d="M9.20177 2.88069L8.39931 2.07824C8.29499 1.97392 8.12541 1.97392 8.02109 2.07824L3.66268 6.43664L1.97967 4.75363C1.87535 4.64931 1.70576 4.64931 1.60144 4.75363L0.798454 5.55555C0.694135 5.65986 0.694135 5.82945 0.798454 5.93377L3.47331 8.60862C3.52573 8.66105 3.59421 8.68673 3.66268 8.68673C3.73116 8.68673 3.79964 8.66051 3.85206 8.60862L9.20177 3.25945C9.30609 3.15513 9.30609 2.98555 9.20177 2.88123V2.88069Z"
                                                      fill="#222222"/>
                                            </svg>
                                        </span>
                                        </span>
                                        <span class="txt">Đặt</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </li>`;
        });
        $("#search-box-product").html(htmlProduct);
        FormatHtml.init();
        ProductDetail.init();
    },
    initEventSearchBar: function () {
        let me = this;
        $("#btn-search-product").off('click').click(function (e) {
            var $this = $(this);
            let dataSearch = $("#input-search-product").val();
            Ultis.setLocalStorage("searchInputNoEncrypt", dataSearch, 365, 1);
            let href = document.location.href;
            if (href.includes("search.htm")) {
                SearchManager.init();
            } else {
                window.location = "/search.htm";
            }

        });
        $('#input-search-product').keypress(function (e) {
            var $this = $(this);
            if (e.which == 13) {
                let dataSearch = $("#input-search-product").val();
                Ultis.setLocalStorage("searchInputNoEncrypt", dataSearch, 365, 1);
                let href = document.location.href;
                if (href.includes("search.htm")) {
                    SearchManager.init();
                } else {
                    window.location = "/search.htm";
                }

            }
        });
    },
    getLocalStorage: function (cname) {
        var data = localStorage.getItem(cname);
        if (data != null) {
            return data;
        }
        return "";
    },
};
function initPage() {
    let windowW = $(window).width();
    Ultis.checkNotiExpired();
    $('.close-noti').click(function () {
        $('.td-wrapper').removeClass('active-noti');
        Ultis.setNotiExpired();
        fixPositionStickyMenu();
    })
    //click muc luc box
    $('.csdcb-toc .toc-header').off('click').click(function () {
        if ($(this).parent().hasClass('active')) {
            $(this).parent().removeClass('active')
        } else {
            $(this).parent().addClass('active');

        }
    });
    // click Q&A box
    $('.list-questions .questions-item').off('click').click(function () {
        console.log($(this));
        if ($(this).hasClass('action')) {
            $(this).removeClass('action');
        } else {
            $(this).addClass('action');
            $('.list-questions .questions-item').not(this).removeClass('action');
        }
    });
    checkExpired();
    function checkExpired() {
        let arrCartCookie = Ultis.getLocalStorage(localArrCart);
        if (arrCartCookie.length > 2) {
            Ultis.checkCartExpired();
        }
    }
    setInterval(function () {
        checkExpired();
    }, 10000);

    // Dat: init action nut Dat Ban
    BookingManager.init();
    ProductAction.actionAddCart();
    CartAction.init();
    $('.social-link').each(function () {
        let typeint = $(this).data("typeint");
        $(this).addClass(getSocialClass(typeint));
    });
    function getSocialClass(type) {
        switch (type) {
            case 1:
                return "fb";
                break;
            case 2:
                return "zl";
                break;
            case 3:
                return "ig";
                break;
            case 4:
                return "tiktok";
                break;
            case 5:
                return "yt";
                break;
            case 6:
                return "twt";
                break;
            default:
                return "";
        }
    }
    
 
    if (windowW > 800) {

    } else {
        $('.td-header .src-btn').off('click').click(function () {
            if ($(this).parent().parent().hasClass('expanded')) {
                $(this).parent().parent().removeClass('expanded')
            } else {
                $(this).parent().parent().addClass('expanded')
            }
        });
    }
};

let Ultis = {
    windowW: $(window).width(),
    option: {
        parentPromotion: 4,
        wraptSelect: "select-timeBox",
        timeBegin: "09:30 AM",
        timeEnd: "10:30 PM",
        stepTimeOption: 30,
        totalMinuteFromNow: 30,
    },
    maxMinuteCart: 360, // Check time giỏ hàng tinh bang phut
    maxMinuteNoti: 720, // Check time noti tinh bang phut

    stepMinute: 15, // Thời gian bước nhảy trong dropdown chọn giờ
    beforeMinute: 30, // Tính từ hiện tại thì chỉ bind time hiện tại + với chỗ này trở đi
    getLocalStorage: function (cname, noEnrypt) {
        var data = localStorage.getItem(cname);
        if (!(noEnrypt === 1)) {
            data = Ultis.decrypted(data);
        }
        if (data != null) {
            return data;
        }
        return "";

    },
    setLocalStorage: function (cname, cvalue, exdays, noEnrypt) {
        //console.log('noEnrypt', noEnrypt);
        if (noEnrypt === 1) {
            localStorage.setItem(cname, cvalue);
        } else {
            localStorage.setItem(cname, Ultis.encrypted(cvalue));
        }
    },

    getCart: function () {
        let arrCartCookie = Ultis.getLocalStorage(localArrCart);
        let arrCart = [];
        if (arrCartCookie.length > 0) {
            try {
                arrCart = JSON.parse(arrCartCookie);
            }
            catch (e) {
                arrCart = [];
            }
        }
        return arrCart;
    },

    encrypted: function (text) {
        if (text != null) {
            return CryptoJS.AES.encrypt(text.toString(), passEncrypted);
        }
        return "";
    },
    decrypted: function (string) {
        if (string != null) {
            try {
                return CryptoJS.AES.decrypt(string, passEncrypted).toString(CryptoJS.enc.Utf8);
            }
            catch (err) {
                return string;
            }
        }
        return "";
    },

    //clear giỏ hàng sau 6tiếng
    setCartExpired: function () {
        localStorage.setItem(localExpired, new Date().getTime());
    },
    checkCartExpired: function () {
        var me = this;
        var now = new Date().getTime();
        var time = localStorage.getItem(localExpired);
        //console.log("----------------");
        //console.log(now);
        //console.log(time);
        if ((now - time) >= (me.maxMinuteCart * 60000)) {
            //console.log("..........");
            //console.log(now);
            //console.log(time);
            let arr = [];
            Ultis.setLocalStorage(localArrCart, JSON.stringify(arr), 365);
            CartAction.updateCartInfo();
            return false;
        } else {
            return true;
        }
    },

    //clear noti sau 12 tiếng
    setNotiExpired: function () {
        localStorage.setItem(localNotiExpired, new Date().getTime());
    },
    checkNotiExpired: function () {
        var me = this;
        var now = new Date().getTime();
        var time = localStorage.getItem(localNotiExpired);
        //console.log(time);

        if ((now - time) >= (me.maxMinuteNoti * 60000)) {
            $('.td-wrapper').addClass('active-noti'); // AnhDP: 20/05/2023: Tam tat de k lo khoang trang, chu y, cai nay chi show khi ajjax get notice co data thi moi show, con khi k co notice ma chay cai nayf se bi hien thi dong trang tren header
            return false;
        } else {
            return true;
        }
    },

    /*
    -- isToday: nếu DatePicker chọn là quá khứ thì biến này là 0, còn nếu là ngày hiện tại thì là 1, và ngày tương lai là 2
    -- wraptSelect: truyền ID của thẻ <SELECT>: ví dụ truyền vào "ddlTime"
    -- timeBegin: thời gian bắt đầu để gen ra OTION đầu tiên
    -- timeEnd: thời gian kết thúc để gen ra OTION cuối cùng
    -- stepTimeOption: bước nhảy để bind ra các Option với khoảng cách time tương ứng, ví dụ biến này là 15 thì time gen ra sẽ là ["9:00", "9:15", "9:30", "9:45"]
    -- totalMinuteFromNow: khoảng cách thời gian được đặt tính từ hiện tại, ví dụ: chỉ đc đặt đơn 1 tiếng tính từ thời điểm hiện tại thì truyền vào là 60
    ---------------- BEGIN DEMO ---------------- 
    -- HTML: <select id="ddlTime"></select>
    -- JS: 
    let wraptSelect = "ddlTime";
    let timeBegin = "09:30 AM";
    let timeEnd = "10:30 PM";
    let stepTimeOption = 30;
    let totalMinuteFromNow = 30;
    let arrOptTime = bindTimeDropdownList(isToday, timeEnd, stepTimeOption, totalMinuteFromNow);
    for(let i = 0; i < arrOptTime.length; i++){
        $(`#${wraptSelect}`).append(`<option value="${arrOptTime[i]}" ${i===0 ? "selected" : ""}>${arrOptTime[i]}</option>"`);
    }
    ---------------- END DEMO ---------------- 
    */
    bindTimeDropdownList: function (isToday, timeBegin, timeEnd, stepTimeOption, totalMinuteFromNow) {
        var times = []; // time array
        let now = moment();
        //now = moment("4/27/2023 01:12 PM"); // Test
        let begin = moment(`${now.month() + 1}/${now.date()}/${now.year()} ${timeBegin}`);
        let end = moment(`${now.month() + 1}/${now.date()}/${now.year()} ${timeEnd}`);

        //console.log(now.date() > day);

        if (isToday === 2) { // Ngày truyền vào lớn hơn hiện tại thì trả full time
            var tt = 0; // start time
            var ap = [' AM', ' PM']; // AM-PM

            //loop to increment the time and push results in array
            for (var i = 0; tt < 24 * 60; i++) {
                var hh = Math.floor(tt / 60); // getting hours of day in 0-24 format
                var mm = (tt % 60); // getting minutes of the hour in 0-55 format
                //console.log(hh + "-" + mm);
                let temp = moment(`${now.month() + 1}/${now.date()}/${now.year()} ${hh}:${mm}`);
                //console.log(temp);
                if ((temp >= begin) && (temp <= end)) {
                    if ((hh % 12) === 0) {
                        times.push(hh + ':' + ("0" + mm).slice(-2) + ap[Math.floor(hh / 12)]);
                    } else {
                        times.push(("0" + (hh % 12)).slice(-2) + ':' + ("0" + mm).slice(-2) + ap[Math.floor(hh / 12)]);
                    }
                }
                tt = tt + stepTimeOption;
                //console.log('----------------------------');
            }
        } else if (isToday === 1) { // Check thời gian hiện tại để bind cho khớp

            now.add(totalMinuteFromNow, 'minutes');
            //begin.add(30, 'minutes');
            // console.log(now);
            // console.log(begin);
            // console.log(now - begin);
            //console.log(moment.duration(totalMinuteFromNow, 'minutes')._milliseconds);
            if ((now - begin) >= 0) {
                begin = now;
            } else {
                //begin.add(totalMinuteFromNow, 'm');
            }
            //console.log(moment.duration(totalMinuteFromNow, 'minutes'));
            //let hourS = begin.hour();
            //let minS = begin.minute();
            //let hourE = end.hour();
            //let minE = end.minute();
            //console.log(`hourS = ${hourS}, minS = ${minS}, hourE = ${hourE}, minE = ${minE}`);


            var tt = 0; // start time
            var ap = [' AM', ' PM']; // AM-PM

            //loop to increment the time and push results in array
            for (var i = 0; tt < 24 * 60; i++) {
                var hh = Math.floor(tt / 60); // getting hours of day in 0-24 format
                var mm = (tt % 60); // getting minutes of the hour in 0-55 format
                //console.log(hh + "-" + mm);
                let temp = moment(`${now.month() + 1}/${now.date()}/${now.year()} ${hh}:${mm}`);
                //console.log(temp);
                if ((temp >= begin) && (temp <= end)) {
                    if ((hh % 12) === 0) {
                        times.push(hh + ':' + ("0" + mm).slice(-2) + ap[Math.floor(hh / 12)]);
                    } else {
                        times.push(("0" + (hh % 12)).slice(-2) + ':' + ("0" + mm).slice(-2) + ap[Math.floor(hh / 12)]);
                    }
                }
                tt = tt + stepTimeOption;
                //console.log('----------------------------');
            }
        } else { // Trường hợp ngày truyền vào < hơn hiện tại thì không có giá trị về thời gian
            times = [];
        }


        //console.log('---------------------------');
        //console.log(times);
        return times;
    },
    bindOptionTime: function (date, callback) {
        let now = new Date();
        //now.setHours(now.getHours());
        now.setMinutes(now.getMinutes() + 45); // AnhDP (28/11/2022): Set giờ hiện tại thêm 45 phút để so sánh loại trừ giờ phía trước của mảng dropdown

        //now.setHours(18);
        //now.setMinutes(31);
        //console.log(now);
        let selectedDay = date;

        let arrTimeOrigin = getArrayTimeByStep(15);
        let arrTime = [];
        for (let i = 0; i < arrTimeOrigin.length; i++) {

            let str = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()} ${arrTimeOrigin[i]}`;
            let nowTemp = new Date(str);

            let valueHour = nowTemp.getHours() + ":" + nowTemp.getMinutes();
            if (now.getDate() == selectedDay) { // Voi ngay hien tai thi sinh ra array tu date hien tai tro di
                if (nowTemp > now) {
                    arrTime.push({ "value": valueHour, "text": arrTimeOrigin[i] });
                }
            } else { // Lay all Date
                arrTime.push({ "value": valueHour, "text": arrTimeOrigin[i] });
            }
        }


        let optTime = "";
        $.each(arrTime, function (i, v) {
            optTime += `<li>
                            <a href="javascript:;" data-value="${v.value}" class ="slt-btn time-change">${v.text}</a>
                        </li>`;
            if (i == 0) {
                $("#txtTime").html(v.text);
                $("#txtValueTime").val(v.value);
            }
        });
        //console.log(optTime);
        $("#select-timeBox").html(optTime);

        // Copy trong LIB
        function getArrayTimeByStep(x) {
            //var x = 5; //minutes interval
            var times = []; // time array
            var tt = 0; // start time
            var ap = [' AM', ' PM']; // AM-PM

            //loop to increment the time and push results in array
            for (var i = 0; tt < 24 * 60; i++) {
                var hh = Math.floor(tt / 60); // getting hours of day in 0-24 format
                var mm = (tt % 60); // getting minutes of the hour in 0-55 format
                if ((hh >= 9) && (hh < 22)) {
                    //console.log(hh + "-" + mm);
                    times.push(("0" + (hh % 12)).slice(-2) + ':' + ("0" + mm).slice(-2) + ap[Math.floor(hh / 12)]);
                } else if (hh == 22) {
                    if (mm <= 30) {
                        times.push(("0" + (hh % 12)).slice(-2) + ':' + ("0" + mm).slice(-2) + ap[Math.floor(hh / 12)]);
                    }
                }
                tt = tt + x;
                //console.log(tt);
            }

            //console.log('---------------------------');
            //console.log(times);

            return times;
        }
        function getArrayTimeByStepMoment(fromDate, x) {
            //console.log(a);
            const locale = 'en'; // or whatever you want...
            const hours = [];
            moment.locale(locale);
            let currentHour = fromDate.getHours();

            for (let hour = 0; hour < 24; hour++) {

                if (hour > (currentHour)) {
                    // Push full Hour
                    hours.push(moment({ hour }).format('h:mm A'));

                    // Push Hour and a half of Hour
                    hours.push(
                        moment({
                            hour,
                            minute: x
                    }).format('h:mm A')
                    );
                }

            }

            return hours;
        }
        (typeof callback != 'undefined') ? callback() : {};
    },
    getClassSeoStar: function (val) {
        //console.log(`getClassSeoStar = ${val}`);
        switch (val) {
            case 1:
                return "one-star";
            case 1.5:
                return "one-star half-star";
            case 2:
                return "two-star";
            case 2.5:
                return "two-star half-star";
            case 3:
                return "three-star";
            case 3.5:
                return "three-star half-star";
            case 4:
                return "four-star";
            case 4.5:
                return "four-star half-star";
            case 5:
                return "full-star";
            default:
                return "";
        }
    },

    getTimeByHourAndMinute: function (time) {
        let [hours, minutes] = time.substr(0, time.length - 2).split(":").map(Number);
        if (time.includes("PM") && hours !== 12) hours += 12;
        return 1000/*ms*/ * 60/*s*/ * (hours * 60 + minutes);
    },

    funcDate: function (callback) {
        var me = this;
        //date
        var $button_open_close = $('#button__api-open-close'),
            $input_open_close = $('#bookingDateCome').pickadate({
                monthsFull: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
                monthsShort: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
                weekdaysShort: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
                format: 'dd mmmm',
                formatSubmit: 'mm/dd/yyyy',
                firstDay: 0,
                today: 'Hôm nay',
                close: 'Đóng',
                min: 0,
                max: 90,
                clear: false,
                onOpen: function () {
                    $button_open_close.text('Close');
                },
                onClose: function () {
                    $button_open_close.text('Open');
                },
                onSet: function (context) {
                    $("#select-timeBox").html("");
                    let chkdayNow = 0;
                    let datePick = $("#DateCome").find("input[name*='_submit']").val();
                    if (datePick == moment().format('MM/DD/YYYY')) {
                        chkdayNow = 1;
                    } else {
                        chkdayNow = 2;
                    }
                    //let arrOptTime = Ultis.bindTimeDropdownList(chkdayNow, me.option.timeBegin, me.option.timeEnd, me.option.stepTimeOption, me.option.totalMinuteFromNow);
                    //if (arrOptTime.length <= 0) {
                    //    $("#txtTime").addClass("outtime");
                    //    $("#boxTime").addClass("outtime-background");
                    //    $("#txtTime").html("Hết giờ");
                    //    $("#txtValueTime").val("outtime");
                    //    $('#boxTime .dropdown-btn').off('click');
                    //} else {
                    //    $("#txtTime").removeClass("outtime");
                    //    $("#boxTime").removeClass("outtime-background");
                    //    for (let i = 0; i < arrOptTime.length; i++) {
                    //        $(`#${me.option.wraptSelect}`).append(`<li><a href="javascript:;" data-value="${arrOptTime[i]}" class ="slt-btn time-change">${arrOptTime[i]}</a></li>`);
                    //        if (i == 0) {
                    //            $("#txtTime").html(arrOptTime[i]);
                    //            $("#txtValueTime").val(arrOptTime[i]);
                    //        }
                    //        $("#chk-time").removeClass("wrong");
                    //        Ultis.funcTime();
                    //    }
                    //}
                    Ultis.funcTime();
                    BookingManager.bindListTime();
                }
            }),
            picker_open_close = $input_open_close.pickadate('picker');
        $button_open_close.on('click', function (event) {
            if (picker_open_close.get('open')) {
                picker_open_close.close();
            } else {
                picker_open_close.open();
            }
            event.stopPropagation()
        }).on('mousedown', function (event) {
            event.preventDefault();
        });
        
        $('.icon-time-calendar').click(function() {
            event.stopPropagation();
            picker_open_close.open();
        });
        (typeof callback != 'undefined') ? callback() : {};
    },
    funcCoso: function () {
        // co so 
        $('#boxRes .dropdown-btn').off('click').click(function () {
            if ($('#boxRes').hasClass('active')) {
                $('#boxRes').removeClass('active');
            } else {
                $('#boxRes').addClass('active');
            }
        });
        $('#boxRes .res-change').off('click').click(function () {
            let resName = $(this).html();
            let resId = $(this).data("resid");
            $("#txtResName").html(resName);
            $("#txtResId").val(resId);
            $('#boxRes').removeClass('active');
            BookingManager.bindListTime();
        });

        $(document).on('click', function (e) {
            if ($(e.target).closest($('#boxRes')).length === 0) {
                $('#boxRes').removeClass('active');
            }
        });
    },
    funcTime: function () {
        //time
        $('#boxTime .dropdown-btn').off('click').click(function () {
            if ($('#boxTime').hasClass('active')) {
                $('#boxTime').removeClass('active');
            } else {
                $('#boxTime').addClass('active');
            }
        });
        $('#boxTime .time-change').off('click').click(function () {
            let name = $(this).html();
            let value = $(this).data("value");
            $("#txtTime").html(name);
            $("#txtValueTime").val(value);
            $('#boxTime').removeClass('active');
        });
        $(document).on('click', function (e) {
            if ($(e.target).closest($('#boxTime')).length === 0) {
                $('#boxTime').removeClass('active');
            }
        });

    },
    funcVou: function () {
        //uu dai
        $('#boxVou .dropdown-btn').off('click').click(function () {
            if ($('#boxVou').hasClass('active')) {
                $('#boxVou').removeClass('active');
            } else {
                $('#boxVou').addClass('active');
            }
        });
        $('#boxVou .vou-change').off('click').click(function () {
            let name = $(this).html();
            let value = $(this).data("value");
            $("#txtVouName").html(name);
            $("#txtVouId").val(value);
            $('#boxVou').removeClass('active');
        });
        $('#boxVou').on('focusout', function () {
            $(this).removeClass('active');
        });
    },

    getThumbWidthKaliko: function (filename, w) {
        //console.log('filename', filename);
        if (!(filename.length > 0)) return noThumb;

        try {
            if (filename.indexOf("http") > -1)
                return StorageDomain + filename;
            if (w > 0) {
                var extention = filename.substring(filename.lastIndexOf("."), (filename.length));
                //console.log('extention', extention);
                return StorageDomain + "/data/thumb_" + w + filename;
            } else {
                return StorageDomain + filename;
            }

        }
        catch (err) {
            return err;
        }

    },

    initHeaderList: function () {
        $('.csdcb-bottom').find('h1, h2, h3, h4, h5, h6').each(function (i, v) {
            $(v).attr('id', 'header-' + i);
        });

        $('.toc-content .catIndexHead').each(function (i, v) {
            $(v).off('click').click(function () {
                scrollToObj($('#header-' + i), 400);
            });
        });
    },
    scrollToId: function (id) {
        $("html, body").animate({ scrollTop: $('#' + id).offset().top }, 400);
    },
    scrollToObj: function (obj, top) {
        //console.log(obj);
        $("html, body").animate({ scrollTop: obj.offset().top - top }, 400);
    },
    formatFixDistance: function (met) {
        let fixKm = ((met*(100-fixDistancePercent)/100)/1000).toFixed(2) ;
        return fixKm + " km";
    },
    formatFixDuration: function (second) {
        let fixMinute = Math.ceil((second*(100-fixDurationPercent)/100)/60) ;
        return fixMinute + " phút";
    },
};

function fixPositionStickyMenu() {
    console.log('call fixPositionStickyMenu');
    let wWidth = $(window).width();
    let $wrapper = $('.td-wrapper');
    let $header = $wrapper.find('.td-header');
    let $menuSticky = $('.tagBox');
    let headerHeight = $header.height();

    // first time
    let currentTimer = 0;
    const myInterval = setInterval(function () {
        currentTimer++;
        if (currentTimer < 5) {
            headerHeight = $('.td-wrapper').find('.td-header').height();
            if (wWidth <= 800) {
                $wrapper.css('padding-top', headerHeight + 'px');
            }
            $menuSticky.css('--headerHeight', headerHeight + 'px');
            //console.log('headerHeight', headerHeight);
        } else {
            clearInterval(myInterval);
        }
    }, 100);

    window.addEventListener('scroll', function (e) {
        headerHeight = $header.height();
        //console.log('headerHeight', headerHeight);
        if (wWidth <= 800) {
            $wrapper.css('padding-top', headerHeight + 'px');
        }
        $menuSticky.css('--headerHeight', headerHeight + 'px');
    });


}


var FormatHtml = {
    init: function ($helpers) {
        let me = this;

        $("[rel*='number']").priceFormat({
            prefix: '',
            suffix: '',
            centsSeparator: '.',
            thousandsSeparator: ',',
            centsLimit: 0,
        });

        $("[rel*='currency']").priceFormat({
            prefix: '',
            suffix: '',
            centsSeparator: '.',
            thousandsSeparator: ',',
            centsLimit: 0,
            allowNegative: true,
        });

        $('.close-fancy-popup').off('click').click(function (e) {
            $.fancybox.close();
        });
    },
};

var EditorEmbed = {
    options: {
        wraptId: '',
    },
    init: function (o) {
        var me = this;
        if (o) {
            me.options = $.extend(me.options, o);
        }

        console.log('EditorEmbed.init()', me.options.wraptId);

        let $wrapt = $('#' + me.options.wraptId);

        $wrapt.find('.mediaEmbedCode').each(function (i, v) {
            let $this = $(v);
            let type = $this.attr('type');


            switch (type) {
                default:
                case 'gallery':
                    me.initGallery(i, v);
                    break;

            }
        });
    },
    initGallery: function (i, v) {
        let me = this;
        let id = $(v).data('id');

        console.log(`initGallery: ${id}`);

        // call API get gallery Data
        $('#log').val(1);
        $.ajax({
            url: apiDomain + "/news.htm",
            data: {
                m: 'get-gallery',
                galleryId: id,
            },
            crossDomain: true,
            dataType: 'jsonp',
            type: "POST",
            beforeSend: function () {
            },
            success: function (rs) {
                //console.log(rs);
                if (rs.Success) {
                    let jsonGallery = rs.Data.JsonGallery;
                    let arr = [];
                    try {
                        arr = JSON.parse(jsonGallery);
                    } catch (e) {
                        console.error('Error parsing JSON:', e);
                    }
                    bindGalleryHtml(i, v, arr, rs.Data.Caption);
                    formatGallery(i, v);
                    //me.bindNewsListHtml(rs.Data, rs.Total);
                }
            }
        });

        function bindGalleryHtml(indexWrapt, wrapt, arr, caption) {
            let htm = '';

            htm = `<div class="box-csdcb-images-caption" id="swiper-gallery-${indexWrapt}">
                    <div class="swiper caption-images-sw" id="caption-images-sw-${indexWrapt}">
                      <div class="swiper-wrapper">`;

            //console.log('bindGalleryHtml', arr);

            $.each(arr, function (i, v) {
                htm += `<div class="swiper-slide">
                          <div class="box-item-caption">
                            <div class="child-images">
                              <div class="bg-black"></div>
                              <span class="images-main">
                                <img src="${me.getThumbWebp(v.ava, 800)}" alt="">
                              </span>
                              <span class="images-blur">
                                <img src="${me.getThumbWebp(v.ava, 800)}" alt="">
                              </span>
                            </div>

                            <p class="desr-caption ${caption.length > 0 ? '' : 'hid'}">
                              ${caption}
                            </p>
                          </div>
                        </div>`;
            });

            htm += `</div>
                      <div class="caption-images-sw-pagination" id="caption-images-sw-pagination-${indexWrapt}"></div>
                    </div>

                    <div class="caption-images-sw-prev" id="caption-images-sw-prev-${indexWrapt}">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M15 18L9 12L15 6" stroke="#333333" stroke-width="2" stroke-miterlimit="10"
                          stroke-linecap="square" />
                      </svg>
                    </div>
                    <div class="caption-images-sw-next" id="caption-images-sw-next-${indexWrapt}">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M9 18L15 12L9 6" stroke="#333333" stroke-width="2" stroke-miterlimit="10"
                          stroke-linecap="square" />
                      </svg>
                    </div>
                  </div>`;

            $(wrapt).html(htm);
        }

        function formatGallery(indexWrapt, wrapt) {
            //$(wrapt).find();

            let swiper = new Swiper(`#caption-images-sw-${indexWrapt}`, {
                spaceBetween: 20,
                centeredSlides: true,

                pagination: {
                    el: `#caption-images-sw-pagination-${indexWrapt}`,
                    type: 'fraction',
                },
                navigation: {
                    nextEl: `#caption-images-sw-next-${indexWrapt}`,
                    prevEl: `#caption-images-sw-prev-${indexWrapt}`
                },
            });
        }
    },
    getThumbWebp: function (filename, w) {
        //console.log('getThumbWebp filename', filename);

        if (!(filename.length > 0)) return '';

        try {
            if (filename.indexOf("http") > -1)
                return storageDomain + filename;
            if (w > 0) {
                return `${storageDomain}/data/thumb_${w}/${filename}`;
            } else {
                return storageDomain + filename;
            }

        }
        catch (err) {
            return err;
        }
    }
}
$.ajaxPrefilter(function (options, originalOptions, jqXHR) {
    try {
        //console.log(originalOptions);
        if ($('#log').val()=="1") options.data = $.param($.extend(originalOptions.data, { 'data': $('#token').val() }));
        //console.log(options);
    } catch (e) {

    }
});
$(document).ajaxSuccess(function (event, request, options) {
    $('#log').val(0);
});
$(document).ajaxError(function (event, request, options) {
    $('#log').val(0);
});

var Authen = {
    init: function (callback) {
        $('#log').val(1);
        $.ajax({
            url: apiDomain + "/authen.htm",
            data: { m: 'get-authen' },
            crossDomain: true,
            dataType: 'jsonp',
            type: "POST",
            beforeSend: function () {

            },
            success: function (xhr) {
                (typeof callback != 'undefined') ? callback(xhr.Data) : {};
            }
        });
    }
};