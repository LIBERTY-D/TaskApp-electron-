
const { app, BrowserWindow,ipcMain, Menu,MenuItem } = require('electron')
const  os =  require("os")
const fs =  require("fs")
const windowStateKeeper = require('electron-window-state');
const path = require('node:path')


let mainWindow;
let todoWindow;
let userTasks =[]

const isMac = process.platform === 'darwin'
let home = os.homedir()+"/tasks.txt"
let isDev = process.env.NODE_ENV

function createWindow () {
  let mainWindowState = windowStateKeeper({
    defaultWidth: 800,
    defaultHeight: 600
  });
    mainWindow = new BrowserWindow({
      width: mainWindowState.width,
      height:mainWindowState.height,
      height: 600,
      x:mainWindowState.x,
      y:mainWindowState.y,
      icon:"./assets/app_icon.ico",
      show:false,
      resizable:false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        sandbox:false,

      }
       
    })

  mainWindowState.manage(mainWindow)
  mainWindow.loadFile('main.html')
  mainWindow.show()
   if(isDev=="development"){
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("close",()=>{
    mainWindow=null
    userTasks = null
  })
}
function createTodoWindow () {
  todoWindow = new BrowserWindow({
    width: 400,
    height: 400,
    show:false,
    resizable:false,
    parent:mainWindow,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      sandbox:false,
    },
    


  })


todoWindow.loadFile('todoWindow.html')
todoWindow.once("ready-to-show",()=>{
todoWindow.show()
  if(isDev=="development"){
    todoWindow.webContents.openDevTools();
  }
})
todoWindow.on("close",()=>{
  todoWindow=null
  
})
}


app.on("ready",()=>{
  // create window
  createWindow()
  // set application menu
  const mainWindowMenu  =  Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(mainWindowMenu)

  if(isMac){
    app.dock.setIcon(`${__dirname}/assets/app_icon.ico`)
    app.dock.setBadge("TaskApp")
    app.setName("TaskApp")
    
  
  }
 
  


 app.on('activate', () => {
   if (BrowserWindow.getAllWindows().length === 0) {
     createWindow()
   }
 })

// when window is fully loaded then send
 mainWindow.webContents.on("did-finish-load",()=>{
  getTasks()
 })

//  fill task array when app ready
 getTasksLoad()
})


ipcMain.on("createWindow",(ev ,args)=>{
  createTodoWindow()
})

ipcMain.on("add:item",async(ev,args)=>{

 
  if (fileExist(home)){
    await fs.readFile(home,(err,data)=>{
      if(err){
        console.log(err)
      }else{
       
       userTasks = JSON.parse(data.toString())
       userTasks.unshift(args)
       writeDataToFile(home,userTasks)
       
      }
      })
  
  }else{
     userTasks.unshift(args)
    writeDataToFile(home,userTasks)
  }
  
  mainWindow.webContents.send("add:item",args)

})


ipcMain.on("right-click",(e,args)=>{
  let menu =  new Menu()
// add menuItem
  menu.append(new MenuItem({
    label:"complete task",
    click:()=>sendClickedMenu("complete")
  }))
  menu.append(new MenuItem({
    label:"remove from completion",
    click:()=>sendClickedMenu("uncomplete")
  }))
// end off menuItem
  menu.popup({
    window:mainWindow,
    x:args.x,
    y:args.y,

  })
 

})
// listen to checked 

ipcMain.on("checked",(e,args)=>{
  let id  =  args
  userTasks =  userTasks.map((currentValue,_)=>{
     if (currentValue.id == id){
      return {...currentValue,completed:true}
     }
     return currentValue
     
  })
  writeDataToFile(home,userTasks)
})

// listen to unchecked

ipcMain.on("unchecked",(e,args)=>{
   let id  =  args
  
  userTasks =  userTasks.map((currentValue,_)=>{
     if (currentValue.id == id){
      return {...currentValue,completed:false}
     }
     return currentValue
     
  })
  writeDataToFile(home,userTasks)
})
// delete todo
ipcMain.on("delete",(e,args)=>{
  let id =  args
   userTasks=  userTasks.filter((currentValue,_)=>currentValue.id !== id)
   writeDataToFile(home,userTasks)
})


app.on('mainWindow-all-closed', () => {
  if (process.platform !== 'darwin') {
    userTasks = null
    app.quit()
  }
})


// reusable
let template =[
  {
    label:"Quit",
    submenu:[
     {
      label:"close",
      click:()=>app.quit()

     }
    ]
  },
  {
      label:"Todo",  
      submenu:[
          {
          label:"create task",
          accelerator:isMac?"Command+n":"Control+n",
          click:()=>createTodoWindow()
          },
         {
          label:"clear",
          click:()=>clearTodos(),
          accelerator:isMac?"Command+x":"Control+x"
          
         }
      ]
  }
]



function sendClickedMenu(message){

 mainWindow.webContents.send("clicked-menu",message)
}


function clearTodos(){
mainWindow.webContents.send("clear","clear")
userTasks =[]
if (fileExist(home)){
  fs.unlink(home,(err)=>{
      if(err){
        console.log("The was an error deleting file")
      }
  })
}

}

function writeDataToFile(home,data){
  fs.writeFile(home,JSON.stringify(data),(err)=>{
    if (err){
      console.log(err)
    }
  })
}
// check if file exist
function fileExist(home){
  return fs.existsSync(home)
}

// load tasks file
async function  getTasks(){
  if (fileExist(home)){
    await fs.readFile(home,async (err,data)=>{
      if(err){
        console.log("err")
      }else{
        let res  =  await data.toString()
        sendgetTasks(res)
      }
      
    })
  }

}

// send tasks to main.html
function sendgetTasks(data){

 mainWindow.webContents.send("task-array",data)
 
}


async function  getTasksLoad(){
  if (fileExist(home)){
    await fs.readFile(home,async (err,data)=>{
      if(err){
        console.log("err")
      }else{
        let res  =  JSON.parse(await data.toString())
        userTasks  =  res
      }
      
    })
  }

}