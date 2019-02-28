import './index.scss';

class Controller {
  static get $inject() {
    return ['NotificationService'];
  }

  constructor(NotificationService) {
    this.NotificationService = NotificationService;
    this.name = '';
    this.page = document.getElementById('page1');
    this.page2 = document.getElementById('page2');
  }

  login() {
    if (this.name.length > 4) {
      console.log(this.page2);
      this.NotificationService.show('success', `Hello ${this.name}! Welcome to App`);

      this.page.style = 'display: none';
      this.page2.style = 'display: block';
    } else {
      this.NotificationService.show('error', `Invalid username ${this.name}! Try again`);
    }
  }
  logout() {
    this.NotificationService.show('success', `Good Luck ${this.name}!!!`);

    this.page.style = 'display: block';
    this.page2.style = 'display: none';
    this.name = '';
  }
}

export default {
  controller: Controller,
  template: require('./index.html'),
};
