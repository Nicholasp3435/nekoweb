console.log('Loaded', document.currentScript.src);


var talks = [
    'How can i help you?',
    'Nice day!',
    'Glad to meet you.',
    'At your service',
    'Helloo'
]

clippy.load('Clippy', function(agent) {
    console.log(agent.animations());

    agent.element.setAttribute('aria-hidden', 'true');

    agent.show();
    const talk = () => {
        agent.speak(talks[Math.floor(Math.random() * talks.length)]);
        agent.animate();
    }
    
    agent.element.addEventListener("click", () => {
        talk();
    });

    window.addEventListener("offline", (e) => {
        agent.stop();
        agent.play('GetAttention');
        agent.speak("You appear to be off-line!");
    });

    window.addEventListener("online", (e) => {
        agent.stop();
        agent.play('Congratulate');
        agent.speak("We're back on-line!");
    });
});