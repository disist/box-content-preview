import throttle from 'lodash.throttle';
import Browser from './Browser';
import { CLASS_HIDDEN } from './constants';

const SHOW_PREVIEW_CONTROLS_CLASS = 'box-show-preview-controls';
const CONTROLS_BUTTON_CLASS = 'bp-controls-btn';
const CONTROLS_AUTO_HIDE_TIMEOUT_IN_MILLIS = 1500;

class Controls {
    /**
     * Indicates if the control bar should be hidden or not
     *
     * @property {boolean}
     */
    shouldHide = true;

    /**
     * Indicates if an element in the controls is focused
     *
     * @property {boolean}
     */
    isFocused = false;

    /**
     * [constructor]
     *
     * @param {HTMLElement} container - The container
     * @return {Controls} Instance of controls
     */
    constructor(container) {
        // Maintain a list of buttons for cleanup
        this.buttonRefs = [];

        // Container for the buttons
        this.containerEl = container;

        this.controlsWrapperEl = this.containerEl.appendChild(document.createElement('div'));
        this.controlsWrapperEl.className = 'bp-controls-wrapper';

        this.controlsEl = this.controlsWrapperEl.appendChild(document.createElement('div'));
        this.controlsEl.className = 'bp-controls';

        this.containerEl.addEventListener('mousemove', this.mousemoveHandler);
        this.controlsEl.addEventListener('mouseenter', this.mouseenterHandler);
        this.controlsEl.addEventListener('mouseleave', this.mouseleaveHandler);
        this.controlsEl.addEventListener('focusin', this.focusinHandler);
        this.controlsEl.addEventListener('focusout', this.focusoutHandler);

        if (Browser.hasTouch()) {
            this.containerEl.addEventListener('touchstart', this.mousemoveHandler);
            this.controlsEl.addEventListener('click', this.clickHandler);
        }
    }

    /**
     * [destructor]
     * @return {void}
     */
    destroy() {
        this.containerEl.removeEventListener('mousemove', this.mousemoveHandler);
        this.controlsEl.removeEventListener('mouseenter', this.mouseenterHandler);
        this.controlsEl.removeEventListener('mouseleave', this.mouseleaveHandler);
        this.controlsEl.removeEventListener('focusin', this.focusinHandler);
        this.controlsEl.removeEventListener('focusout', this.focusoutHandler);

        if (Browser.hasTouch()) {
            this.containerEl.removeEventListener('touchstart', this.mousemoveHandler);
            this.controlsEl.removeEventListener('click', this.clickHandler);
        }

        this.buttonRefs.forEach((ref) => {
            ref.button.removeEventListener('click', ref.handler);
        });
    }

    /**
     * Checks if the button is a preview controls button
     *
     * @private
     * @param {HTMLElement|null} element - button element
     * @return {boolean} true if element is a preview control button
     */
    isPreviewControlButton(element) {
        return (
            !!element &&
            (element.classList.contains(CONTROLS_BUTTON_CLASS) ||
                element.parentNode.classList.contains(CONTROLS_BUTTON_CLASS))
        );
    }

    /**
     * @private
     * @return {void}
     */
    resetTimeout() {
        clearTimeout(this.controlDisplayTimeoutId);
        this.controlDisplayTimeoutId = setTimeout(() => {
            clearTimeout(this.controlDisplayTimeoutId);

            if (!this.shouldHide) {
                this.resetTimeout();
            } else {
                this.containerEl.classList.remove(SHOW_PREVIEW_CONTROLS_CLASS);

                if (this.controlsEl.contains(document.activeElement)) {
                    document.activeElement.blur(); // blur out any potential button focuses within preview controls
                }
            }
        }, CONTROLS_AUTO_HIDE_TIMEOUT_IN_MILLIS);
    }

    /**
     * Mouse move handler
     *
     * @private
     * @return {void}
     */
    mousemoveHandler = throttle(() => {
        this.containerEl.classList.add(SHOW_PREVIEW_CONTROLS_CLASS);
        this.resetTimeout();
    }, CONTROLS_AUTO_HIDE_TIMEOUT_IN_MILLIS - 500);

    /**
     * Mouse enter handler
     *
     * @private
     * @return {void}
     */
    mouseenterHandler = () => {
        this.shouldHide = false;
    };

    /**
     * Mouse leave handler
     *
     * @private
     * @return {void}
     */
    mouseleaveHandler = () => {
        this.shouldHide = true;
    };

    /**
     * Handles all focusin events for the module.
     *
     * @param {Event} event - A DOM-normalized event object.
     * @return {void}
     */
    focusinHandler = (event) => {
        // When we focus onto a preview control button, show controls
        if (this.isPreviewControlButton(event.target)) {
            this.containerEl.classList.add(SHOW_PREVIEW_CONTROLS_CLASS);
            this.isFocused = true;
            this.shouldHide = false;
        }
    };

    /**
     * Handles all focusout events for the module.
     *
     * @param {Event} event - A DOM-normalized event object.
     * @return {void}
     */
    focusoutHandler = (event) => {
        // When we focus out of a control button and aren't focusing onto another control button, hide the controls
        if (this.isPreviewControlButton(event.target) && !this.isPreviewControlButton(event.relatedTarget)) {
            this.isFocused = false;
            this.shouldHide = true;
        }
    };

    /**
     * Handles click events for the control bar.
     *
     * @param {Event} event - A DOM-normalized event object.
     * @return {void}
     */
    clickHandler = (event) => {
        event.preventDefault();
        // If we are not focused in on the page num input, allow hiding after timeout
        this.shouldHide = !this.isFocused;
    };

    /**
     * Adds buttons to controls
     *
     * @private
     * @param {string} text - button text
     * @param {Function} handler - button handler
     * @param {string} [classList] - optional class list
     * @param {string} [buttonContent] - Optional button content HTML
     * @return {void}
     */
    add(text, handler, classList = '', buttonContent = '') {
        const cell = document.createElement('div');
        cell.className = 'bp-controls-cell';

        const button = document.createElement('button');
        button.setAttribute('aria-label', text);
        button.setAttribute('title', text);
        button.className = `${CONTROLS_BUTTON_CLASS} ${classList}`;
        button.addEventListener('click', handler);

        if (buttonContent) {
            button.innerHTML = buttonContent;
        }

        cell.appendChild(button);
        this.controlsEl.appendChild(cell);

        // Maintain a reference for cleanup
        this.buttonRefs.push({
            button,
            handler
        });

        return button;
    }

    /**
     * Enables the controls.
     *
     * @return {void}
     */
    enable() {
        this.controlsEl.classList.remove(CLASS_HIDDEN);
    }

    /**
     * Disables the controls.
     *
     * @return {void}
     */
    disable() {
        this.controlsEl.classList.add(CLASS_HIDDEN);
    }
}

export default Controls;
