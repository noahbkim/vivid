class EventInterface {

  constructor() {
    this.listeners = {}
  }

  addEventListener(event, listener) {
    if (this.listeners[event] === undefined)
      this.listeners[event] = [listener];
    else this.listeners[event].push(listener);
  }

  removeEventListener(event, listener: (data: any) => void) {
    if (this.listeners[event] !== undefined) {
      const i = this.listeners[event].indexOf(listener);
      return this.listeners[event].splice(i, i + 1);
    }
  }

  fireEvent(event, data) {
    const listeners = this.listeners[event];
    if (listeners !== undefined)
      listeners.map(function(listener) { listener(data); });
  }

  /** Experimental: raises callback of linked event source. */
  propagateEvent(object, event, rename) {
    object.addEventListener(event, (data) => {
      this.fireEvent(rename || event, data);
    });
  }

}