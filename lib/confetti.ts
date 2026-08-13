import confetti from 'canvas-confetti';

export function fireChoreConfetti() {
  confetti({
    particleCount: 90,
    spread: 70,
    startVelocity: 35,
    origin: { y: 0.7 },
    colors: ['#ff6fb5', '#ffce45', '#4fc3f7', '#7ed957', '#a06cf5'],
  });
}

export function fireTrophyConfetti() {
  const duration = 1500;
  const end = Date.now() + duration;
  const colors = ['#ffce45', '#ff6fb5', '#a06cf5'];

  (function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0 }, colors });
    confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();

  confetti({
    particleCount: 150,
    spread: 100,
    startVelocity: 45,
    origin: { y: 0.5 },
    colors,
  });
}
