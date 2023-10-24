const {v4:uuidv4} =  require("uuid")
const {ipcRenderer} =  require("electron")
const addBtn =  document.getElementById("addBtn")
addBtn.addEventListener("click",()=>{
let value  = document.getElementById("myInput")
if(value.value){

    let time  = new Date().toLocaleTimeString().trim().replace("AM"," ")
    let date =  new Date().toLocaleDateString()
    ipcRenderer.send("add:item",{id:uuidv4(),value:value.value,completed:false,time,date})
    value.value =" "
    
}
})
