// Gets maximal zIndex in document
window.maxZIndex = function (selector, returnObject) {
    var $absolute = $(selector || '*').filter(function () {
        var position = $(this).css('position');
        return position === 'absolute' || position === 'fixed';
    });

    var max = 1;
    var obj = $absolute.first();

    $absolute.each(function () {
        var $this = $(this);
        var zIndex = parseInt($this.css('z-index'));
        if (zIndex >= max) {
            max = zIndex + 1;
            obj = $this;
        }
    });

    return returnObject ? obj : max;
};

// Popup window lib
(function($){
    var popupOptions = {};
    
    $.popupSetup = function(options) {
        if ($.isPlainObject(options)) {
            popupOptions = options;
        }
    };

    $.popup = function (options, param) {
        
        // Popup inner vars
        var overlayClass = 'popup-overlay';
        var popupClass = 'popup-window';
        var buttonClass = 'popup-button';
        var activeClass = 'active';
        var blurClass = 'popup-blur';
        var $window = $(window);
        var $document = $(document);
        var $body = $('body');
        var oldMSIE = !window.XMLHttpRequest;
        
        // Popup default options
        var defaults = {
            // Popup title  
            title: 'Popup window',
            // Popup content
            text: '',
            // Default buttons set
            buttons: null,
            // Overlay opacity
            overlayOpacity: 0.5,
            // Popup modal mode
            modal: false,
            // Popup could be dragged
            draggable: true,
            // Display close button
            closeButton: true,
            // Callbacks
            callbacks: {
                afterResize: null,
                afterOpen: null,
                afterClose: null,
                beforeClose: null
            },
            // Button OK title
            confirmTitle: 'Confirm',
            // Button OK title
            buttonOk: 'Ok',
            // Button CANCEL title
            buttonCancel: 'Cancel',
            // Button CLOSE title
            buttonClose: 'Close'
        };

        // If popup id already exists
        if (options && options.id) {
            var popup = $('.' + popupClass + '[popup-id=' + options.id + ']').data('popup-data');
            if (popup && popup.setActive) {
                popup.setActive();
                return popup;
            }
        }

        // If options are strings
        if (typeof options == 'string') {
            if (typeof param == 'string') {
                options = {
                    title: options, 
                    text: param 
                };
            } else {
                options = { 
                    text: options 
                };
            }
        }

        // Defaults buttons sets
        return new function () {
            var me = this;

            me.options = $.extend({}, defaults, popupOptions, options);

            // Popup buttons according options set

            if (typeof me.options.buttons == 'string') {
                switch (me.options.buttons) {

                    // Confirmation set
                    case 'confirm':
                    case 'yesno':
                        if (!options || !options.title) {
                            me.options.title = me.options.confirmTitle;
                        }

                        me.options.buttons = [
                            {
                                title: me.options.buttonOk,
                                key: 13,
                                action: function () {
                                    if (typeof me.options.action == 'function') {
                                        return me.options.action.call(me);
                                    }
                                }
                            },
                            {
                                title: me.options.buttonCancel
                            }
                        ];
                        break;

                    // Popup with OK button
                    case 'alert':
                        me.options.buttons = {
                            title: me.options.buttonOk,
                            key: 13
                        };
                        break;

                    // Popup with CLOSE button
                    case 'close':
                        me.options.buttons = {
                            title: me.options.buttonClose
                        };
                        break;

                    // Empty set
                    default:
                        me.options.buttons = [];
                        break;
                }
            }

            // Add popup button
            function addButton(button, prepend) {
                // Prepend or append action
                var add = prepend === true ? 'prepend' : 'append';
                
                // If button is jQuery object
                if (button instanceof $) {
                    me.buttons[add](button.addClass(buttonClass));
                    return button;

                // If button is params object with title
                } else if ($.isPlainObject(button) && button.title) {
                    var newButton = $('<div unselectable="on">').html(button.title)
                    me.buttons[add](newButton.addClass(buttonClass));

                    // If attrs provided
                    if ($.isPlainObject(button.attrs)) {
                        newButton.attr(button.attrs);
                    }

                    // If button is closing or action provided
                    if (button.close !== false || typeof button.action == 'function') {
                        newButton.click(function () {
                            if (me.isActive()) {

                                if (typeof button.action == 'function') {
                                    button.close = (button.action.call(me, newButton) !== false) && (button.close !== false);
                                }

                                if (button.close !== false) {
                                    me.close();
                                }
                            }
                        });
                    }

                    // If hide required
                    if (button.hide) {
                        newButton.hide();
                    }

                    // Hot keys for button
                    if (typeof button.key == 'number') {
                        me.popupWindow.keydown(function (e) {
                            if (me.isActive() && e.which == button.key) {
                                newButton.click();
                                e.stopPropagation();
                            }
                        });
                    }

                    return newButton;
                }
            };

            // Add popup button : append
            me.appendButton = function (button) {
                return addButton(button);
            };

            // Add popup button : prepend
            me.prependButton = function (button) {
                return addButton(button, true);
            };

            // Check popup is active
            me.isActive = function () {
                return me.popupWindow.hasClass(activeClass);
            };

            // Returns buttons jQuery object
            me.buttons = function (filter) {
                return me.buttons.children(filter);
            };
            
            // Change popup content
            me.html = function (html) {
                me.loading(false);
                me.text.html(html);
                me.resize();
            };

            // Find element in popup using jQuery
            me.find = function (selector) {
                return me.text.find(selector);
            };

            // Scrolling popup to jQuery object
            // * jQuery.scrollTo plugin is required
            me.scrollTo = function (to, speed, params) {
                if ($.fn.scrollTo) {
                    me.text.scrollTo(to, speed, params);
                }
            }

            // Resize and center popup according it's content
            me.resize = function (animate) {
                var css = { height: $window.height() };
                var heightDiff = me.popupWindow.height() - me.text.height();
                var textHeight = $window.height() - 20 - heightDiff;

                if (oldMSIE) {
                    css.left = $window.scrollLeft();
                    css.top = $window.scrollTop();
                    css.width = $window.width();
                }

                me.overlay.css(css);

                if (me.options.modal) {
                    me.modal.css(css);
                }

                if (me.options.maxHeight) {
                    textHeight = Math.min(textHeight, me.options.maxHeight);
                }

                me.text.css('max-height', textHeight);
                me.messages.hide().css('width', me.text.width() + 'px').show();

                me.popupWindow.hide();

                var left = $window.scrollLeft() + ($window.width() - me.popupWindow.width()) / 2;
                var top = $window.scrollTop() + ($window.height() - me.popupWindow.height()) / 2;
                var change = animate === true ? 'animate' : 'css';

                me.popupWindow.show().stop(true, true)[change]({
                    left: left,
                    top: top,
                    opacity: 1
                }, 200);

                // Callback after resize
                me.callback('afterResize');
            };

            // Get active popup
            me.getActive = function() {
                return $('.' + popupClass + '.' + activeClass);
            }

            // Set popup active
            me.setActive = function () {
                if (!me.isActive()) {
                    var active = me.getActive().removeClass(activeClass);
                    var index = parseInt(active.css('z-index')) + 1;
                    me.popupWindow.attr('tabindex', index).css('z-index', index).addClass(activeClass);
                    me.popupWindow.focus();
                }
            };

            // Show or hide loading indicator
            me.loading = function (state) {
                me.text[state ? 'addClass' : 'removeClass']('loading');
            };

            // Close popup
            me.close = function (silent) {
                if (me.closing) {
                    return false;
                }

                me.closing = true;

                // Callback before close
                if (silent !== true && me.callback('beforeClose') === false) {
                    me.closing = false;
                    return false;
                }

                $window.unbind('scroll.popup resize.popup', me.resize);

                me.popupWindow.removeClass(activeClass).fadeOut(200, function () {

                    if (me.options.modal) {
                        me.modal.remove();
                    }

                    // If only one popup opened
                    if ($('.' + popupClass).length == 1) {
                        me.overlay.fadeOut(200, function () {
                            if (oldMSIE) {
                                $('select').each(function (index, el) {
                                    el.style.visibility = $.data(el, 'visibility');
                                });
                            }

                            var focus = me.overlay.data('focused');
                            
                            if (focus instanceof jQuery) {
                                focus.focus();
                            }

                            if (silent !== true) {
                                me.callback('afterClose');
                            }
                            
                            me.popupWindow.remove();
                            me.overlay.remove();
                            
                            delete me;

                            $('.' + blurClass).removeClass(blurClass)
                        });

                    // Focus another popup
                    } else {
                        if (silent !== true) {
                            me.callback('afterClose');
                        }

                        me.popupWindow.remove();
                        var popup = maxZIndex('.' + popupClass, true);
                        
                        if (popup instanceof jQuery) {
                            popup.addClass(activeClass).focus();
                        }

                        delete me;
                    }
                });
            };

            // Run callback by name
            me.callback = function (func) {
                if (typeof me.options.callbacks[func] == 'function') {
                    return me.options.callbacks[func].call(me);
                }
                if (typeof me.options[func] == 'function') {
                    return me.options[func].call(me);
                }
            }

            // Start drag window
            function startDrag(e) {
                var startOffset = me.popupWindow.offset();
                var startX = e.pageX;
                var startY = e.pageY;
                var width = $document.width();
                var height = $document.height();

                $body.bind('mousemove.popup-move', function (e) {
                    var left = startOffset.left + (e.pageX - startX);
                    var top = startOffset.top + (e.pageY - startY);
                    var popupWidth = me.popupWindow.width();
                    var popupHeight = me.popupWindow.height();

                    left = Math.max(10, left);
                    top = Math.max(10, top);
                    left = Math.min(width - popupWidth - 10, left);
                    top = Math.min(height - popupHeight - 10, top);

                    me.popupWindow.offset({
                        left: left,
                        top: top
                    });
                });
            }

            // Stop drag window
            function stopDrag(e) {
                $body.unbind('mousemove.popup-move');
            }

            // Create popup window
            me.getActive().removeClass(activeClass);

            me.overlay = $('.' + overlayClass);
            me.titleCaption = $('<span>').html(me.options.title);
            me.title = $('<div unselectable="on">').addClass('popup-title').html(me.titleCaption);
            me.messages = $('<div>').addClass('popup-messages');
            me.text = $('<div>').addClass('popup-text').html(me.options.text);
            me.buttons = $('<div>').addClass('popup-buttons');
            me.popupWindow = $('<div>').append(me.title, me.messages, me.text, me.buttons);

            $body.append(me.popupWindow);

            // If overlay not created before
            if (me.overlay.length == 0) {
                me.overlay = $('<div>').addClass(overlayClass)
                $body.append(me.overlay);

                if (oldMSIE) {
                    $('select').each(function (index, el) {
                        $.data(el, 'visibility', el.style.visibility);
                        el.style.visibility = 'hidden';
                    });
                }

                var compat = oldMSIE || me.overlay.css('position') != 'fixed';

                me.overlay.css({
                    'position': (compat ? 'absolute' : 'fixed'),
                    'opacity': 0,
                    'z-index': maxZIndex(':visible')
                }).fadeTo(200, me.options.overlayOpacity).click(function () {
                    var popup = me.getActive().data('popup-data');
                    if (popup && popup.close) {
                        if (!popup.options.modal) {
                            popup.close();
                        }
                    }
                });

                var focused = $('input:focus');
                me.overlay.data('focused', focused);
                focused.blur();

                // Apply blur
                if (me.options.blur) {
                    $(me.options.blur).addClass(blurClass);
                }
            }

            // Close by ESCAPE key
            me.popupWindow.keydown(function (e) {
                if (me.isActive() && e.which == 27) {
                    me.close();
                    e.stopPropagation();
                }
            });

            // Init popup buttons
            if (!$.isArray(me.options.buttons)) {
                me.options.buttons = [me.options.buttons];
            }

            for (var i = 0, j = me.options.buttons.length; i < j; i++) {
                me.appendButton(me.options.buttons[i]);
            }

            // Get top zIndex
            var index = maxZIndex(':visible');

            // If popup is modal
            if (me.options.modal) {
                me.modal = $('<div>').addClass('popup-modal').css('z-index', index).click(function () {
                    me.modal.stop(true, true).fadeTo(1, 0.3).fadeTo(500, 0);
                    me.popupWindow.focus();
                }).css('opacity', 0);
                me.popupWindow.before(me.modal);
                index++;
            }

            // Init drag events
            if (me.options.draggable) {
                me.title.mousedown(startDrag).mouseup(stopDrag);
            }

            // Init CLOSE button
            if (me.options.closeButton) {
                var close = $('<div>').addClass('popup-close').html('X').click(me.close);
                me.title.append(close);
            }

            // If popup attrs provided
            if ($.isPlainObject(me.options.attrs)) {
                me.popupWindow.attr(me.options.attrs);
            }

            // Set popup zIndex and bring to top
            me.popupWindow.attr('tabindex', index).css({
                'display': 'block',
                'top': ($window.scrollTop() + ($window.height() - me.popupWindow.height()) / 2 - 100),
                'opacity': 0,
                'z-index': index
            }).addClass('popup-window active');

            $window.bind('scroll.popup resize.popup', me.resize);

            if (me.options.id) {
                me.popupWindow.attr('popup-id', me.options.id);
            }

            me.loading(me.options.loading);
            me.resize();

            me.popupWindow.data('popup-data', me).mousedown(me.setActive).focus();
            me.callback('afterOpen');
        };
    };

    // Open popup by clicking on jQuery object
    $.fn.popup = function (options, param) {
        this.click(function () {
            var popup = $.popup(options, param);
            $(this).data('popup-data', popup);
            return false;
        });
        return this;
    };
})(jQuery);

// Add inline messages to input
// text string
// color string: null | red | green | yellow (default: null)
// scroll bool: true | false (default: true) * jQuery.scrollTo plugin required
(function($){
    $.fn.comment = function (text, color, scroll) {
        var input = this;

        // Create message wrapper
         var wrapper = $('<div class="input-message-wrapper">').insertBefore(input);

        // Get container and maximum width of message
        var container = $('body');
        
        input.parents().each(function () {
            var parent = $(this);
            var overflow = parent.css('overflow');

            if (overflow != 'visible') {
                container = parent;
                var width = parent.outerWidth() - (input.offset().left - parent.offset().left);
                wrapper.css('min-width', width + 'px');
                return false;
            }
        });

        // Scroll to input
        if (scroll !== false && $.fn.scrollTo) {
            container.scrollTo(input, 500, {
                offset: -$(window).height() / 2
            });
        }

        if (text) {
            // Init message element
            
            var message = $('<div class="input-message">').html(text).prependTo(wrapper);
            var height = input.outerHeight() + parseInt(input.css("margin-top"));

            // Set message position
            message.css({
                'top': height + 15,
                'left': parseInt(input.css("margin-left")) + 3,
                'opacity': 0
            });

            // Set color
            if (color) {
                message.addClass(color);
            }

            // Show
            message.animate({ 
                'opacity': 1, 
                'top': height + 2 
            }, 200);
        }

        input.focus()
            .addClass('input-commented')
            .bind('blur.input-message keydown.input-message change.input-message', input.uncomment);

        return false;
    };

    $.fn.uncomment = function () {
        var input = $(this);
        var wrapper = input.prev();

        input
            .unbind('blur.input-message keydown.input-message change.input-message')
            .removeClass('input-commented');

        if (wrapper.hasClass('input-message-wrapper')) {
            wrapper.fadeOut(200, function () {
                wrapper.remove();
            });
        }
    };

    $.uncomment = function () {
        $('.input-messaged').uncomment();
    };
})(jQuery);