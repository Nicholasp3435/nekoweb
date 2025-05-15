console.log('Loaded', document.currentScript.src);


var talks = [
    'How can I help you?',
    "It's a nice day <3",
    'Glad to meet you :3',
    'At your service ~',
    'Meowdy :3'
]

clippy.load('Clippy', function(agent) {
    console.log(agent.animations());

    agent.element.setAttribute('aria-hidden', 'true');

    agent.show();
    agent.moveTo(window.innerWidth - 150, window.innerHeight - 150);

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

    document.querySelector("#guestbook button").addEventListener('click', (e) => {
        agent.stop();
        if (e.target.classList.contains("close")) {
            agent.moveTo(e.clientX - window.innerWidth * 0.3, e.clientY);
            agent.play('GetAttention');
            agent.speak(`Thanks for checking out my guestbook!\n\nDo you require any assistance?`);
            agent.play('Writing');
        } else {
            agent.moveTo(window.innerWidth - 150, window.innerHeight - 150);
        }
    })


});
