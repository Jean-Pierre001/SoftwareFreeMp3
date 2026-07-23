// ---------- Login YouTube ----------

import { youtubeStatus, youtubeLoginBtn } from "./dom.js";

async function checkYoutubeStatus(){

    if(!youtubeStatus) return

    try{
        const response = await fetch("/api/youtube-status")
        const data = await response.json()

        if(data.connected){
            youtubeStatus.className = "youtube-status connected"
            youtubeStatus.textContent = "✓ YouTube conectado"
        }else{
            youtubeStatus.className = "youtube-status disconnected"
            youtubeStatus.textContent = "✕ YouTube no conectado"
        }
    }catch{
        youtubeStatus.className = "youtube-status disconnected"
        youtubeStatus.textContent = "✕ YouTube no conectado"
    }
}

if (youtubeLoginBtn) {

    youtubeLoginBtn.addEventListener("click", () => {

        window.electron.openYoutubeLogin()

        setTimeout(async () => {
            const path = await window.electron.saveYoutubeCookies()

            console.log(
                "Archivo creado:",
                path
            )

            checkYoutubeStatus()
        }, 30000)
    })
}

checkYoutubeStatus()
