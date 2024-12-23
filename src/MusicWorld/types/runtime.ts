interface Runtime {
    debug: {
        fps: number,
        spt: number, 
        showTime: number, 
        effectTime?: number,
        playTime?: number,
        audioTime?: number, 
        audioDelay?: number,
        cAudioDelay?: number, 

        clickTimes?: number,
    },
    game: {
        percent: number,
    }
}

export default Runtime