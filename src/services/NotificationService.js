export default class NotificationService {
  constructor() {
    this.notification = document.getElementById('notification-message');
  }

  show(type, message) {
    if (type === 'success') {
      this.notification.style = 'background: green; display: block; color: white';
    } else if (type === 'error') {
      this.notification.style = 'background: red; display: block; color: white';
    } else {
      throw Error(`NotificationService doesn't have ${type} type!`);
    }

    this.notification.innerText = message;
    setTimeout(() => {
      this.notification.style = 'display: none';
    }, 3000);
  }
}
