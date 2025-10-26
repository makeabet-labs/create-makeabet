// Wrapper to fix eventemitter3 ESM import issues
// This re-exports from the local ESM build copy
import { EventEmitter } from './eventemitter3.esm.js';
export { EventEmitter, EventEmitter as default };
