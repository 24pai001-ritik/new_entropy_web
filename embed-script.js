(function () {
    const script = document.currentScript;
    const chatbotId = script.getAttribute('data-chatbot-id');
    const apiUrl = script.getAttribute('data-api-url') || 'http://localhost:5000';

    const container = document.createElement('div');
    container.id = 'gemini-chatbot-container';
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999';

    const button = document.createElement('div');
    button.innerHTML = '💬';
    button.style.width = '60px';
    button.style.height = '60px';
    button.style.background = '#3b82f6';
    button.style.borderRadius = '50%';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.color = 'white';
    button.style.fontSize = '30px';
    button.style.cursor = 'pointer';
    button.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.4)';
    button.style.transition = 'all 0.3s ease';

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.style.width = '380px';
    iframe.style.height = '600px';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '16px';
    iframe.style.background = 'transparent';
    iframe.style.position = 'absolute';
    iframe.style.bottom = '80px';
    iframe.style.right = '0';
    iframe.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
    iframe.src = `${apiUrl}/chatbot/${chatbotId}/ui`;

    button.onclick = () => {
        const isHidden = iframe.style.display === 'none';
        iframe.style.display = isHidden ? 'block' : 'none';
        button.style.transform = isHidden ? 'scale(0.9) rotate(90deg)' : 'scale(1) rotate(0deg)';
    };

    container.appendChild(iframe);
    container.appendChild(button);
    document.body.appendChild(container);
})();
