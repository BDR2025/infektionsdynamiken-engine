export default {
  name: 'timing',
  onMode(mode, ctx){ this.active = (mode === 'timing'); },
  onTick(t, ctx){ if(!this.active) return; /* später: Frequenz = σ bzw. γ */ },
  onUnmount(ctx){}
};
