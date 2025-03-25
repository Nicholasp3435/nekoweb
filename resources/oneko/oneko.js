// oneko.js: https://github.com/adryd325/oneko.js

console.log('Loaded', document.currentScript.src);

(function oneko() {
    const isReducedMotion =
      window.matchMedia(`(prefers-reduced-motion: reduce)`) === true ||
      window.matchMedia(`(prefers-reduced-motion: reduce)`).matches === true;
  
    if (isReducedMotion) return;
  
    const nekoEl = document.createElement("div");

    let nekoPos;
    let mousePos;
  
    if (localStorage.getItem('nekoPos') && localStorage.getItem('mousePos')) {
      nekoPos = JSON.parse(localStorage.getItem('nekoPos'));
      mousePos = JSON.parse(localStorage.getItem('mousePos'));
    } else {
      nekoPos = {x: 32, y: 32};
      mousePos = {x: 0, y: 0};
      localStorage.setItem('nekoPos', JSON.stringify(nekoPos));
      localStorage.setItem('mousePos', JSON.stringify(mousePos));
    }
  
    let frameCount = 0;
    let idleTime = 0;
    let idleAnimation = null;
    let idleAnimationFrame = 0;
  
    const nekoSpeed = 15;
    const spriteSets = {
      idle: [[-3, -3]],
      alert: [[-7, -3]],
      scratchSelf: [
        [-5, 0],
        [-6, 0],
        [-7, 0],
      ],
      scratchWallN: [
        [0, 0],
        [0, -1],
      ],
      scratchWallS: [
        [-7, -1],
        [-6, -2],
      ],
      scratchWallE: [
        [-2, -2],
        [-2, -3],
      ],
      scratchWallW: [
        [-4, 0],
        [-4, -1],
      ],
      tired: [[-3, -2]],
      sleeping: [
        [-2, 0],
        [-2, -1],
      ],
      N: [
        [-1, -2],
        [-1, -3],
      ],
      NE: [
        [0, -2],
        [0, -3],
      ],
      E: [
        [-3, 0],
        [-3, -1],
      ],
      SE: [
        [-5, -1],
        [-5, -2],
      ],
      S: [
        [-6, -3],
        [-7, -2],
      ],
      SW: [
        [-5, -3],
        [-6, -1],
      ],
      W: [
        [-4, -2],
        [-4, -3],
      ],
      NW: [
        [-1, 0],
        [-1, -1],
      ],
    };
  
    function init() {
      nekoEl.id = "oneko";
      nekoEl.ariaHidden = true;
      nekoEl.style.width = "32px";
      nekoEl.style.height = "32px";
      nekoEl.style.position = "fixed";
      nekoEl.style.pointerEvents = "none";
      nekoEl.style.imageRendering = "pixelated";
      nekoEl.style.left = `${nekoPos.x - 16}px`;
      nekoEl.style.top = `${nekoPos.y - 16}px`;
      nekoEl.style.zIndex = 2;
  
      let nekoFile = "/resources/oneko/oneko.png"
      const curScript = document.currentScript;
      if (curScript && curScript.dataset.cat) {
        nekoFile = curScript.dataset.cat
      }
      nekoEl.style.backgroundImage = `url(${nekoFile})`;
  
      document.body.appendChild(nekoEl);
  
      document.addEventListener("mousemove", function (event) {
        mousePos.x = event.clientX;
        mousePos.y = event.clientY;
        localStorage.setItem('mousePos', JSON.stringify(mousePos));

      });
  
      window.requestAnimationFrame(onAnimationFrame);
    }
  
    let lastFrameTimestamp;
  
    function onAnimationFrame(timestamp) {
      // Stops execution if the neko element is removed from DOM
      if (!nekoEl.isConnected) {
        return;
      }
      if (!lastFrameTimestamp) {
        lastFrameTimestamp = timestamp;
      }
      if (timestamp - lastFrameTimestamp > 100) {
        lastFrameTimestamp = timestamp
        frame()
      }
      window.requestAnimationFrame(onAnimationFrame);
    }
  
    function setSprite(name, frame) {
      const sprite = spriteSets[name][frame % spriteSets[name].length];
      nekoEl.style.backgroundPosition = `${sprite[0] * 32}px ${sprite[1] * 32}px`;
    }
  
    function resetIdleAnimation() {
      idleAnimation = null;
      idleAnimationFrame = 0;
    }
  
    function idle() {
      idleTime += 1;
  
      // every ~ 20 seconds
      if (
        idleTime > 10 &&
        Math.floor(Math.random() * 200) == 0 &&
        idleAnimation == null
      ) {
        let availableIdleAnimations = ["sleeping", "scratchSelf"];
        if (nekoPos.x < 32) {
          availableIdleAnimations.push("scratchWallW");
        }
        if (nekoPos.y < 32) {
          availableIdleAnimations.push("scratchWallN");
        }
        if (nekoPos.x > window.innerWidth - 32) {
          availableIdleAnimations.push("scratchWallE");
        }
        if (nekoPos.y > window.innerHeight - 32) {
          availableIdleAnimations.push("scratchWallS");
        }
        idleAnimation =
          availableIdleAnimations[
            Math.floor(Math.random() * availableIdleAnimations.length)
          ];
      }
  
      switch (idleAnimation) {
        case "sleeping":
          if (idleAnimationFrame < 8) {
            setSprite("tired", 0);
            break;
          }
          setSprite("sleeping", Math.floor(idleAnimationFrame / 4));
          if (idleAnimationFrame > 192) {
            resetIdleAnimation();
          }
          break;
        case "scratchWallN":
        case "scratchWallS":
        case "scratchWallE":
        case "scratchWallW":
        case "scratchSelf":
          setSprite(idleAnimation, idleAnimationFrame);
          if (idleAnimationFrame > 9) {
            resetIdleAnimation();
          }
          break;
        default:
          setSprite("idle", 0);
          return;
      }
      idleAnimationFrame += 1;
    }
  
    function frame() {
      frameCount += 1;
      const diffX = nekoPos.x - mousePos.x;
      const diffY = nekoPos.y - mousePos.y;
      const distance = Math.sqrt(diffX ** 2 + diffY ** 2);
  
      if (distance < nekoSpeed || distance < 48) {
        idle();
        return;
      }
  
      idleAnimation = null;
      idleAnimationFrame = 0;
  
      if (idleTime > 1) {
        setSprite("alert", 0);
        // count down after being alerted before moving
        idleTime = Math.min(idleTime, 7);
        idleTime -= 1;
        return;
      }
  
      let direction;
      direction = diffY / distance > 0.5 ? "N" : "";
      direction += diffY / distance < -0.5 ? "S" : "";
      direction += diffX / distance > 0.5 ? "W" : "";
      direction += diffX / distance < -0.5 ? "E" : "";
      setSprite(direction, frameCount);
  
      nekoPos.x -= (diffX / distance) * nekoSpeed;
      nekoPos.y -= (diffY / distance) * nekoSpeed;
  
      nekoPos.x = Math.min(Math.max(16, nekoPos.x), window.innerWidth - 16);
      nekoPos.y = Math.min(Math.max(16, nekoPos.y), window.innerHeight - 16);

      localStorage.setItem('nekoPos', JSON.stringify(nekoPos));
  
      nekoEl.style.left = `${nekoPos.x - 16}px`;
      nekoEl.style.top = `${nekoPos.y - 16}px`;
    }
  
    init();
  })();