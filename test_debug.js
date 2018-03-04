Marionette.View.extend({
    className: 'bet-calculator',
    template: template,
    ui: {
        bonusBetInput: '.bonus-game-bet-input',
        /* calc buttons */ repeatBetButton: '.button.repeat-bet',
        clearBetButton: '.button.clear',
        valueBetButton: '.button.value',
        allBetButton: '.all',
    },
    events: {
        'click @ui.repeatBetButton': 'onRepeatBetButtonClick',
        'click @ui.clearBetButton': 'onClearBetButtonClick',
        'click @ui.valueBetButton': 'onValueBetButtonClick',
        'click @ui.allBetButton': 'onAllBetButtonClick'
    },
    initialize: function initialize(options) {
        if (options == null || options.$input == null) {
            console.log('input not found for calculator');
            return;
        }
        this.isDisabled = false;
        this.localStorageVariableName = options.localStorageVariableName;
        this.$bonusBetInput = options.$input;
        this.onBonusBetInputKeyDown = this.onBonusBetInputKeyDown.bind(this);
        this.$bonusBetInput.on('keydown', this.onBonusBetInputKeyDown);
        this.onBonusInputChanged = this.onBonusInputChanged.bind(this);
        this.$bonusBetInput.on('change past input', this.onBonusInputChanged);
    },
    onRender() {
        this.renderCoinsComponent();
    },
    onDestroy: function onDestroy() {
        this.$bonusBetInput.off('keydown', this.onBonusBetInputKeyDown);
    },
    /***     * Добавляет отображение ввода в виде монет     */ renderCoinsComponent() {
        this.$bonusBetInput.parent().append('<span class=\"coins-component\"></span>');
        this.$bonusCoins = this.$bonusBetInput.parent().find('.coins-component');
        _.defer(() => {
            const currentBet = this.getCurrentBet();
            if (currentBet > 0) {
                this.$bonusCoins.coins({
                    value: currentBet
                });
            }
        });
    },
    onBonusBetInputKeyDown: function onBonusBetInputKeyDown(e) {
        if (this.isDisabled === true) {
            return false;
        }
        return inputNumberValidator.validate(e.keyCode, e.ctrlKey);
    },
    onBonusInputChanged: function onBonusInputChanged() {
        this.$bonusBetInput.removeClass('error');
        this.$bonusBetInput.parent().removeClass('error');
        let value = parseInt(this.$bonusBetInput.val());
        if (_.isNaN(value) === true || _.isFinite(value) === false) {
            this.prevVal = null;
            this.$bonusCoins.coins({
                value: 0
            });
            return;
        } else if (this.prevVal === value) {
            return;
        } else if (this._getTotalBet() > appState.authModel.get('coins')) {
            value = this.prevVal || this._getAll();
        }
        this._setBet(value);
    },
    _getAll: function _getAll() {
        return appState.authModel.get('coins');
    },
    /***     * Подсчет общей ставки     * @param newValue - если надо подсчитать общую ставку ДО момента ее сетинга, то передаем ставку с этим параметром     * @returns {*}     * @private     */ _getTotalBet: function _getTotalBet(newValue) {
        return newValue || this.$bonusBetInput.val()
    },
    onRepeatBetButtonClick: function onRepeatBetButtonClick() {
        let localStorageValue = 0;
        if (this.localStorageVariableName) {
            localStorageValue = localStorage.getField(this.localStorageVariableName, {
                usePersonal: true
            });
        }
        this._setBet(localStorageValue || 0);
    },
    onClearBetButtonClick: function onClearBetButtonClick() {
        this._setBet(0);
    },
    onValueBetButtonClick: function onValueBetButtonClick(e) {
        const currentBet = this.getCurrentBet();
        const targetData = $(e.target).data();
        if (_.isEmpty(targetData.method.trim())) {
            return;
        }
        const targetValue = parseInt(targetData.value);
        if (_.isNaN(targetValue) || !_.isFinite(targetValue)) {
            return;
        }
        let newBet;
        switch (targetData.method) {
            case 'plus':
                newBet = currentBet + targetValue;
                break;
            case 'multiply':
                newBet = currentBet * targetValue;
                break;
            case 'divide':
                newBet = currentBet / targetValue;
                break;
            default:
                console.log('Not found method update bet')
        }
        if (this._getTotalBet(newBet) > appState.authModel.get('coins')) {
            return;
        }
        this._setBet(parseInt(newBet));
    },
    onAllBetButtonClick: function onAllBetButtonClick() {
        this._setBet(appState.authModel.get('coins'));
    },
    toggleDisable: function toggleDisable(status) {
        this.isDisabled = status != null ? status : !this.isDisabled;
        this.$el.toggleClass('disabled', this.isDisabled);
    },
    _setBet: function setBet(value) {
        if (this.isDisabled === true) {
            return;
        }
        this.prevVal = value;
        this.$bonusCoins.coins({
            value
        });
        const caretPosition = this.$bonusBetInput.get(0).selectionStart;
        this.$bonusBetInput.val(value).change().get(0);
        this.$bonusBetInput.get(0).selectionStart = caretPosition;
        this.$bonusBetInput.get(0).selectionEnd = caretPosition;
    },
    getCurrentBet: function getCurrentBet() {
        let currentBet = this.$bonusBetInput.val() || 0;
        if (currentBet !== 0) {
            currentBet = parseInt(currentBet);
            if (_.isNaN(currentBet) || !_.isFinite(currentBet)) {
                currentBet = 0;
            }
        }
        return currentBet;
    }
});
const SlotBetCalculatorView = BetCalculatorView.extend({
    onAllBetButtonClick: function onAllBetButtonClick() {
        this._setBet(this._getAll());
    },
    _getAll: function _getAll() {
        let selectedLines = this.options.viewModel.get('selectedLines');
        let betPerLine = parseInt(appState.authModel.get('coins') / selectedLines);
        if (betPerLine * selectedLines > config.maxSlotGameBet) {
            betPerLine = parseInt(config.maxSlotGameBet / this.options.viewModel.get('selectedLines'));
        }
        return betPerLine;
    },
    _getTotalBet: function _getTotalBet(value) {
        value = value || this.getCurrentBet();
        return this.options.viewModel.get('selectedLines') * value;
    }
});
export {
    BetCalculatorView,
    SlotBetCalculatorView
} // WEBPACK FOOTER ////