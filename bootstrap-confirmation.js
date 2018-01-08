function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }
function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }
function getUID(prefix) { do { prefix += ~~(Math.random() * 1000000 /* MAX_UID */); } while (document.getElementById(prefix)); return prefix; }

/*!
 * Bootstrap Confirmation
 * Copyright 2013 Nimit Suwannagate <ethaizone@hotmail.com>
 * Copyright 2014-2017 Damien "Mistic" Sorel <contact@git.strangeplanet.fr>
 * Licensed under the Apache License, Version 2.0
 */

// CONFIRMATION PUBLIC CLASS DEFINITION
// ===============================
var Confirmation = function() {
	'use strict';

	if (typeof $.fn.popover === 'undefined') {
		throw new Error('Confirmation requires popover');
	}

	var activeConfirmation;

	var NAME = 'confirmation';
	var VERSION = '2.4.0';
	var DATA_KEY = 'bs.confirmation';
	var EVENT_KEY = "." + DATA_KEY;
	var JQUERY_NO_CONFLICT = $.fn[NAME];
	var CLASS_PREFIX = 'bs-confirmation';
	var BSCLS_PREFIX_REGEX = new RegExp("(^|\\s)" + CLASS_PREFIX + "\\S+", 'g');

	var BTN_CLASS_DEFAULT = 'btn-sm h-100 d-flex align-items-center ';

	var Default = $.extend({}, $.fn.popover.Constructor.Default, {
		placement: 'top',
		title: 'Are you sure?',
		trigger: 'click',
		content: '',
		popout: false,
		singleton: false,
		copyAttributes: 'href target',
		buttons: null,
		onConfirm: $.noop,
		onCancel: $.noop,
		btnOkClass: 'btn-primary',
		btnOkIconClass: 'material-icons',
		btnOkIconContent: 'check',
		btnOkLabel: 'Yes',
		btnCancelClass: 'btn-secondary',
		btnCancelIconClass: 'material-icons',
		btnCancelIconContent: 'clear',
		btnCancelLabel: 'No',
		// href="#" allows the buttons to be focused
		template:
			'<div class="popover confirmation">' +
				'<div class="arrow"></div>' +
				'<h3 class="popover-header"></h3>' +
				'<div class="popover-body">' +
					'<p class="confirmation-content"></p>' +
					'<div class="confirmation-buttons text-center">' +
						'<div class="btn-group">' +
							'<a href="#" class="btn" data-apply="confirmation"></a>' +
							'<a href="#" class="btn" data-dismiss="confirmation"></a>' +
						'</div>' +
					'</div>' +
				'</div>' +
			'</div>'
	});

	var DefaultType = $.extend({}, $.fn.popover.DefaultType, {
		title: '(string|function)', /* overriding tooltip's '(string|element|function)' type */
		singleton: 'boolean',
		popout: 'boolean',
		rootSelector: 'string',
		copyAttributes: 'string',
		btnOkClass: 'string',
		btnOkIconClass: 'string',
		btnOkIconContent: 'string',
		btnOkLabel: 'string',
		btnCancelClass: 'string',
		btnCancelIconClass: 'string',
		btnCancelIconContent: 'string',
		btnCancelLabel: 'string',
		onConfirm: 'function',
		onCancel: 'function'
	});
	/**
	* Map between keyboard events "keyCode|which" and "key"
	*/
	var Keymap = {
		13: 'Enter',
		27: 'Escape',
		39: 'ArrowRight',
		40: 'ArrowDown'
	};
	var Event = {
		HIDE: "hide" + EVENT_KEY,
		HIDDEN: "hidden" + EVENT_KEY,
		SHOW: "show" + EVENT_KEY,
		SHOWN: "shown" + EVENT_KEY,
		INSERTED: "inserted" + EVENT_KEY,
		CLICK: "click" + EVENT_KEY,
		FOCUSIN: "focusin" + EVENT_KEY,
		FOCUSOUT: "focusout" + EVENT_KEY,
		MOUSEENTER: "mouseenter" + EVENT_KEY,
		MOUSELEAVE: "mouseleave" + EVENT_KEY
		/**
		 * ------------------------------------------------------------------------
		 * Class Definition
		 * ------------------------------------------------------------------------
		 */
	};

	var Confirmation = function() {
		var _Popover = $.fn.popover.Constructor;
		_inheritsLoose(Confirmation, _Popover);

		function Confirmation(element, config) {
			_Popover.apply(this, arguments);

			this.$element = $(element);

			if ((this.config.popout || this.config.singleton) && !this.config.rootSelector) {
				throw new Error('The rootSelector option is required to use popout and singleton features since jQuery 3.');
			}

			// keep trace of selectors
			this.config._isDelegate = false;
			if (config.selector) { // container of buttons
				this.config._selector = this._config._selector = config.rootSelector + ' ' + config.selector;
			}
			else if (config._selector) { // children of container
				this.config._selector = config._selector;
				this.config._isDelegate = true;
			}
			else { // standalone
				this.config._selector = config.rootSelector;
			}

			var self = this;

			if (!this.config.selector) {
				// store copied attributes
				this.config._attributes = {};
				if (this.config.copyAttributes) {
					if (typeof this.config.copyAttributes === 'string') {
						this.config.copyAttributes = this.config.copyAttributes.split(' ');
					}
				}
				else {
					this.config.copyAttributes = [];
				}

				this.config.copyAttributes.forEach(function(attr) {
					this.config._attributes[attr] = this.$element.attr(attr);
				}, this);

				// cancel original event
				this.$element.on(this.config.trigger, function(e, ack) {
					if (!ack) {
						e.preventDefault();
						e.stopPropagation();
						e.stopImmediatePropagation();
					}
				});

				// manage singleton
				this.$element.on('show.bs.confirmation', function(e) {
					if (self.config.singleton) {
						// close all other popover already initialized
						$(self.config._selector).not($(this)).filter(function() {
							return $(this).data('bs.confirmation') !== undefined;
						}).confirmation('hide');
					}
				});
			}
			else {
				// cancel original event
				this.$element.on(this.config.trigger, this.config.selector, function(e, ack) {
					if (!ack) {
						e.preventDefault();
						e.stopPropagation();
						e.stopImmediatePropagation();
					}
				});
			}

			if (!this.config._isDelegate) {
				// manage popout
				this.eventBody = false;
				this.uid = element.id || getUID('group_');

				this.$element.on('shown.bs.confirmation', function(e) {
					if (self.config.popout && !self.eventBody) {
						self.eventBody = $('body').on('click.bs.confirmation.' + self.uid, function(e) {
							if ($(self.config._selector).is(e.target)) {
								return;
							}
							// close all popover already initialized
							$(self.config._selector).filter(function() {
								return $(this).data('bs.confirmation') !== undefined;
							}).confirmation('hide');

							$('body').off('click.bs.' + self.uid);
							self.eventBody = false;
						});
					}
				});
			}
		}

		var _proto = Confirmation.prototype;

		_proto.isWithContent = function() {
			return true;
		};

		_proto.setContent = function() {
			var self = this;
			var $tip = $(this.tip);
			var title = this.getTitle();
			var content = this._getContent();

			$tip.find('.popover-header')[this.config.html ? 'html' : 'text'](title);

			$tip.find('.confirmation-content').toggle(!!content).children().detach().end()[
				// we use append for html objects to maintain js events
				this.config.html ? (typeof content == 'string' ? 'html' : 'append') : 'text'
			](content);

			$tip.on('click', function(e) {
				e.stopPropagation();
			});

			if (this.config.buttons) {
				// configure custom buttons
				var $group = $tip.find('.confirmation-buttons .btn-group').empty();

				this.config.buttons.forEach(function(button) {
					$group.append(
						$('<a href="#"></a>')
							.addClass(button.class || BTN_CLASS_DEFAULT + 'btn btn-secondary')
							.html(button.label || '')
							.attr(button.attr || {})
							.prepend($('<i></i>')
								.addClass(button.iconclass || '')
								.text(button.iconcontent || ''))
							.one('click', function(e) {
								if ($(this).attr('href') === '#') {
									e.preventDefault();
								}

								if (button.onClick) {
									button.onClick.call(self.$element);
								}

								if (button.cancel) {
									self.getOnCancel().call(self.$element, button.value);
									self.$element.trigger('canceled.bs.confirmation', [button.value]);
								}
								else {
									self.getOnConfirm().call(self.$element, button.value);
									self.$element.trigger('confirmed.bs.confirmation', [button.value]);
								}

								self.hide();
							})
					);
				}, this);
			}
			else {
				// configure 'ok' button
				$tip.find('[data-apply="confirmation"]')
					.addClass(BTN_CLASS_DEFAULT + this.config.btnOkClass)
					.html(this.config.btnOkLabel)
					.attr(this.config._attributes)
					.prepend($('<i></i>')
						.addClass(this.config.btnOkIconClass)
						.text(this.config.btnOkIconContent))
					.off('click')
					.one('click', function(e) {
						if ($(this).attr('href') === '#') {
							e.preventDefault();
						}

						self.getOnConfirm().call(self.$element);
						self.$element.trigger('confirmed.bs.confirmation');

						self.$element.trigger(self.config.trigger, [true]);
				
						self.hide();
					});

				// configure 'cancel' button
				$tip.find('[data-dismiss="confirmation"]')
					.addClass(BTN_CLASS_DEFAULT + this.config.btnCancelClass)
					.html(this.config.btnCancelLabel)
					.prepend($('<i></i>')
						.addClass(this.config.btnCancelIconClass)
						.text(this.config.btnCancelIconContent))
					.off('click')
					.one('click', function(e) {
						e.preventDefault();

						self.getOnCancel().call(self.$element);
						self.$element.trigger('canceled.bs.confirmation');

						self.hide();
					});
			}

			$tip.removeClass('fade top bottom left right in');

			// IE8 doesn't accept hiding via the `:empty` pseudo selector, we have to do
			// this manually by checking the contents.
			if (!$tip.find('.popover-header').html()) {
				$tip.find('.popover-header').hide();
			}

			// bind key navigation
			activeConfirmation = this;
			$(window)
				.off('keyup.bs.confirmation')
				.on('keyup.bs.confirmation', this._onKeyup.bind(this));
		};

		/**
		* Remove key binding on destroy
		*/
		_proto.destroy = function() {
			if (activeConfirmation === this) {
				activeConfirmation = undefined;
				$(window).off('keyup.bs.confirmation');
			}

			_Popover.prototype.destroy.call(this);
		};

		/**
		* Remove key binding on hide
		*/
		_proto.hide = function() {
			if (activeConfirmation === this) {
				activeConfirmation = undefined;
				$(window).off('keyup.bs.confirmation');
			}
			_Popover.prototype.hide.call(this);
		};

		/**
		* Navigate through buttons with keyboard
		* @param event
		* @private
		*/
		_proto._onKeyup = function(event) {
			if (!this.tip) {
				activeConfirmation = undefined;
				$(window).off('keyup.bs.confirmation');
				return;
			}

			var $tip = $(this.tip);
			var key = event.key || Keymap[event.keyCode || event.which];

			var $group = $tip.find('.confirmation-buttons .btn-group');
			var $active = $group.find('.active');
			var $next;

			switch (key) {
				case 'Escape':
					this.hide();
					break;

				case 'ArrowRight':
					if ($active.length && $active.next().length) {
						$next = $active.next();
					}
					else {
						$next = $group.children().first();
					}
					$active.removeClass('active');
					$next.addClass('active').focus();
					break;

				case 'ArrowLeft':
					if ($active.length && $active.prev().length) {
						$next = $active.prev();
					}
					else {
						$next = $group.children().last();
					}
					$active.removeClass('active');
					$next.addClass('active').focus();
					break;
			}
		};

		/**
		* Gets the on-confirm callback
		* @returns {function}
		*/
		_proto.getOnConfirm = function() {
			if (this.$element.attr('data-on-confirm')) {
				return getFunctionFromString(this.$element.attr('data-on-confirm'));
			}
			else {
				return this.config.onConfirm;
			}
		};

		/**
		 * Gets the on-cancel callback
		 * @returns {function}
		 */
		_proto.getOnCancel = function() {
			if (this.$element.attr('data-on-cancel')) {
				return getFunctionFromString(this.$element.attr('data-on-cancel'));
			}
			else {
				return this.config.onCancel;
			}
		};

		/**
		* Generates an anonymous function from a function name
		* function name may contain dots (.) to navigate through objects
		* root context is window
		*/
		function getFunctionFromString(functionName) {
			var context = window;
			var namespaces = functionName.split('.');
			var func = namespaces.pop();

			for (var i = 0, l = namespaces.length; i < l; i++) {
				context = context[namespaces[i]];
			}

			return function() {
				context[func].call(this);
			};
		}

		Confirmation._jQueryInterface = function _jQueryInterface(config) {
			return this.each(function () {
				var $this = $(this);
				var data = $this.data(DATA_KEY);

				var _config = typeof config === 'object' ? config : null;

				if (!data && /destroy|hide/.test(config)) {
					return;
				}

				if (!data) {
					data = new Confirmation(this, _config);
					$this.data(DATA_KEY, data);
				}

				if (typeof config === 'string') {
					if (typeof data[config] === 'undefined') {
						throw new Error("No method named \"" + config + "\"");
					}

					data[config]();
				}
			});
		};

		_createClass(Confirmation, null, [{
				key: "VERSION",
				// getters
				get: function get() {
					return VERSION;
				}
			}, {
				key: "Default",
				get: function get() {
					return Default;
				}
			}, {
				key: "NAME",
				get: function get() {
					return NAME;
				}
			}, {
				key: "DATA_KEY",
				get: function get() {
					return DATA_KEY;
				}
			}, {
				key: "EVENT_KEY",
				get: function get() {
					return EVENT_KEY;
				}
			}, {
				key: "Event",
				get: function get() {
					return Event;
				}
			}, {
				key: "DefaultType",
				get: function get() {
					return DefaultType;
				}
			}]);

		return Confirmation;
	}();

	/**
	 * ------------------------------------------------------------------------
	 * jQuery
	 * ------------------------------------------------------------------------
	 */

	$.fn[NAME] = Confirmation._jQueryInterface;
	$.fn[NAME].Constructor = Confirmation;

	$.fn[NAME].noConflict = function () {
		$.fn[NAME] = JQUERY_NO_CONFLICT;
		return Confirmation._jQueryInterface;
	};

	return Confirmation;
}($);
