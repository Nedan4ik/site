module.exports.MessageBuilder = class {
    constructor() {
        this.props = {};
    }

    setToPhone(number) {
        this.props['to'] = number;
        return this;
    }

    setFromPhone(number) {
        this.props['from'] = number;
        return this;
    }

    setMessage(message) {
        this.props['body'] = message;
        return this;
    }

    create() {
        if (!global.twilio) return null;

        return global.twilio.messages.create(this.props);
    }
}