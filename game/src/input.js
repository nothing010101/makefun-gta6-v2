// SOLMAR HEAT II — input.js
// Keyboard + mouse input. WASD move/drive, Shift run, Space handbrake,
// E enter/exit or steal a car, F interact, 1-4 weapon slots, R radio,
// Q call Marisol (getaway car), C call Rico (backup shooter), G shop,
// Esc pause, M mute. Mouse orbits the third-person camera.
export class Input {
  constructor(canvas) {
    this.keys = {};
    this.camAngle = 0;
    this.mouseDX = 0;
    this.onAction = null;
    this.onPause = null;
    this.onMute = null;
    this.onWeapon = null;
    this.onRadio = null;
    this.onCrew = null;
    this.onShop = null;
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      this.keys[e.code] = true;
      if (e.code === 'KeyE' && this.onAction) this.onAction('enter');
      if (e.code === 'KeyF' && this.onAction) this.onAction('interact');
      if (e.code === 'KeyG' && this.onShop) this.onShop();
      if (e.code === 'KeyQ' && this.onCrew) this.onCrew('marisol');
      if (e.code === 'KeyC' && this.onCrew) this.onCrew('rico');
      if (e.code === 'KeyR' && this.onRadio) this.onRadio();
      if (e.code === 'KeyM' && this.onMute) this.onMute();
      if (e.code === 'Escape' && this.onPause) this.onPause();
      if (e.code === 'Digit1' && this.onWeapon) this.onWeapon(1);
      if (e.code === 'Digit2' && this.onWeapon) this.onWeapon(2);
      if (e.code === 'Digit3' && this.onWeapon) this.onWeapon(3);
      if (e.code === 'Digit4' && this.onWeapon) this.onWeapon(4);
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    window.addEventListener('blur', () => { this.keys = {}; });
    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0 && this.onAction) this.onAction('attack');
      if (e.button === 2 && this.onAction) this.onAction('shoot');
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement === canvas) this.mouseDX += e.movementX || 0;
    });
    canvas.addEventListener('click', () => {
      if (document.pointerLockElement !== canvas) canvas.requestPointerLock?.();
    });
  }
  get forward() { return !!(this.keys['KeyW'] || this.keys['ArrowUp']); }
  get back() { return !!(this.keys['KeyS'] || this.keys['ArrowDown']); }
  get left() { return !!(this.keys['KeyA'] || this.keys['ArrowLeft']); }
  get right() { return !!(this.keys['KeyD'] || this.keys['ArrowRight']); }
  get run() { return !!(this.keys['ShiftLeft'] || this.keys['ShiftRight']); }
  get handbrake() { return !!this.keys['Space']; }
  consumeMouseDX() { const d = this.mouseDX; this.mouseDX = 0; return d; }
}
