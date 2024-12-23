import { reactive } from 'vue'
import Runtime from '../types/runtime'
const baseRunTime = { 
    debug: {},
    game: {}
 } as Runtime

export const runTime: Runtime = reactive(baseRunTime)