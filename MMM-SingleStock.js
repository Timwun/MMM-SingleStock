/* global Module, Log */

/* Magic Mirror Module: MMM-SingleStock (https://github.com/balassy/MMM-SingleStock)
 * By György Balássy (https://www.linkedin.com/in/balassy)
 * MIT Licensed.
 */

Module.register('MMM-SingleStock', {
  defaults: {
    stockSymbol: 'SAP.DE',
    updateInterval: 3600000,
    showChange: true,
    label: 'symbol' // 'symbol' | 'companyName' | 'none'
  },

  requiresVersion: '2.1.0',

  getTranslations() {
    return {
      en: 'translations/en.json',
      hu: 'translations/hu.json'
    };
  },

  start() {
    const self = this;
    this.viewModel = null;
    this.hasData = false;

    this._getData(() => self.updateDom());

    setInterval(() => {
      self._getData(() => self.updateDom());
    }, this.config.updateInterval);
  },

  getDom() {
    const wrapper = document.createElement('div');

    if (this.viewModel) {
      const priceEl = document.createElement('div');
      priceEl.innerHTML = `${this.viewModel.label} ${this.viewModel.price}`;
      wrapper.appendChild(priceEl);

      if (this.config.showChange) {
        const changeEl = document.createElement('div');
        changeEl.classList = 'dimmed small';
        changeEl.innerHTML = ` (${this.viewModel.change})`;
        wrapper.appendChild(changeEl);
      }
    } else {
      const loadingEl = document.createElement('span');
      loadingEl.innerHTML = this.translate('LOADING', { symbol: this.config.stockSymbol });
      loadingEl.classList = 'dimmed small';
      wrapper.appendChild(loadingEl);
    }

    return wrapper;
  },

  _getData(onCompleteCallback) {
    const self = this;

    const baseUrl = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${defaults.stockSymbol}`;
    const urlParameters = `?formatted=false&modules=price%2CsummaryDetail%2CpageViews&corsDomain=finance.yahoo.com`;
    const url = baseUrl + urlParameters;

    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function onReadyStateChange() {
      if (this.readyState === 4) {
        if (this.status === 200) {
          self._processResponse(this.response);
          onCompleteCallback();
        } else {
          Log.error(self.name, `MMM-SingleStock: Failed to load data. XHR status: ${this.status}`);
        }
      }
    };

    xhr.send();
  },

  _processResponse(responseBody) {
    const response = JSON.parse(responseBody);
    const res = response.quoteSummary.result[0].price;

    let price = res.regularMarketPrice;
    let change = res.regularMarketChange;
    if(change > 0) change = '+' + change;
    this.viewModel = { price, change};

    switch (this.config.label) {
      case 'symbol':
        this.viewModel.label = res.symbol;
        break;
      case 'companyName':
        this.viewModel.label = res.longName;
        break;
      case 'none':
        this.viewModel.label = '';
        break;
      default:
        this.viewModel.label = this.config.label;
        break;
    }

    if (!this.hasData) {
      this.updateDom();
    }

    this.hasData = true;
  }
});
