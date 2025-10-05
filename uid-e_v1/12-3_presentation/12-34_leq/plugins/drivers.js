export default {
  name: 'drivers',
  onMode(mode, ctx){ this.active = (mode === 'drivers'); },
  onUpdate(ctx){ if(!this.active) return; /* später: β/σ/γ-Familien-Highlight */ },
  onUnmount(ctx){}
};
