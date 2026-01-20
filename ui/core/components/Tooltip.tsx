// import { h, render } from "preact"

// // Can put these in a separate uss file
// document.clearRuntimeStyleSheets()
// document.addRuntimeUSS(`
// .tooltip-trigger {
//     position: relative;
//     display: flex;
// }
// .tooltip-trigger.top {
//     align-items: center;
// }
// .tooltip-trigger.bottom {
//     align-items: center;
// }
// .tooltip-trigger.left {
//     justify-content: center;
// }
// .tooltip-trigger.right {
//     justify-content: center;
// }
// .tooltip-trigger .tooltip{
//     background-color: rgba(0,0,0,0.7);
//     color: #fff;
//     text-align: center;
//     border-radius: 6px;
//     padding: 5px;
//     margin: 5px;
//     opacity: 0;
//     display: none;
//     transition: opacity 0.5s;
//     position: absolute;
// }
// .tooltip-trigger:hover .tooltip {
//     opacity:1;
//     display: flex;
// }

// .tooltip-right{
//     left: 100%;
// }
// .tooltip-left{
//     right: 100%;
// }
// .tooltip-top{
//     bottom:100%;
// }
// .tooltip-bottom{
//     top:100%;
// }
// `)

// function Tooltip({ "class": className = "", children, tooltipText = "Tooltip", position = "right" }) {
//     return <div class={`tooltip-trigger ${position} ${className}`}>
//         {children}
//         <div class={`tooltip tooltip-${position}`}>
//             {tooltipText}
//         </div>
//     </div>
// }

// const App = () => {
//     return <div class="p-12 flex flex-row justify-around">
//         <Tooltip tooltipText="Hallelujah" position="top">
//             <button>Button 1</button>
//         </Tooltip>
//         <Tooltip tooltipText="Hallelujah" position="left">
//             <button>Button 2</button>
//         </Tooltip>
//         <Tooltip tooltipText="Hallelujah" position="bottom">
//             <button>Button 3</button>
//         </Tooltip>
//         <Tooltip tooltipText="Hallelujah" position="right">
//             <button>Button 4</button>
//         </Tooltip>
//     </div>
// }

// render(<App />, document.body)
