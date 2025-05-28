export class MessageDisplay {
    static renderMessage(message, isSent = true) {
        const messageElement = document.createElement('div');
        messageElement.className = `message-bubble ${isSent ? 'message-sent' : 'message-received'}`;
        
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageElement.innerHTML = `
            <div class="message-content">
                <p class="text-sm">${message}</p>
                <span class="message-time">${time}</span>
            </div>
        `;

        return messageElement;
    }

    static addMessage(message, isSent = true) {
        const container = document.getElementById('messages-container');
        if (!container) return;

        const messageElement = this.renderMessage(message, isSent);
        container.appendChild(messageElement);
        this.scrollToBottom();
    }

    static scrollToBottom() {
        const container = document.getElementById('messages-container');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }
}