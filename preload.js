const {ipcRenderer}  = require("electron")

const btn  =  document.getElementById("create")
const my_list = document.getElementById("my-list")
let  rightClicked=null
// create new window
btn.addEventListener("click",()=>{   
    ipcRenderer.send("createWindow")
   
})

// item added 
ipcRenderer.on("add:item",(ev,args)=>{
    let {value,date} =  args
    const  li =  document.createElement("li")
    li.innerText =`${date} --> ${value}`
    my_list.appendChild(li)
   
})

// right click
my_list.addEventListener("contextmenu",(e)=>{
    e.preventDefault()
    if (e.target.tagName =="LI"){
        rightClicked = e.target
        id = rightClicked.getAttribute("id")
        ipcRenderer.send("right-click",{
            x:e.clientX,
            y:e.clientY,
            id,
        })
    }
  
})
// clicked menu

ipcRenderer.on("clicked-menu",(e,args)=>{
  let current_activity = ""
  let id = ""
  if (rightClicked !=null && args=="complete"){
     current_activity = "checked"
     id =  rightClicked.getAttribute("id")

     rightClicked.classList.add("checked")
     rightClicked =null
     
  }
  if(rightClicked!=null && args=="uncomplete" && rightClicked.classList.contains("checked")){
     current_activity="unchecked"
     id =  rightClicked.getAttribute("id")
     rightClicked.classList.remove("checked")
     rightClicked = null
  }

 ipcRenderer.send(current_activity,id)
})
// double click item to delete
my_list.addEventListener("dblclick",(e)=>{

    let element =  e.target
    if(element.tagName=="LI"){
        id = element.getAttribute("id")
        ipcRenderer.send("delete",id)
        my_list.removeChild(element);
    }
   

})

// clear todo

ipcRenderer.on("clear",(e,args)=>{
   let com =  window.confirm("You sure You wan to clear Todos!!!")
   if(com){
      my_list.innerHTML=" "
   }
})

// get tasks array


window.addEventListener("DOMContentLoaded",()=>{
    
        ipcRenderer.on("task-array",(e,args)=>{
        if (args){
            let tasks= JSON.parse(args)
            let task = tasks.map((currentValue,index)=>{
               let   {id,value,date,completed}  =  currentValue
               return `<li id=${id} ${completed==true?"class=checked":""}>${date} --> ${value}</li>`
            }).join(" ")
            my_list.innerHTML =  task
        }
    })
})