const btn_simulate = document.getElementById("simulate");
const simulate_block = document.getElementById("simulate-here");
const inputFloors = document.getElementById('input-floors');
const inputLifts = document.getElementById('input-lifts');
const errortext =  document.getElementById('error-text');

var Lifts = [];
var Floors = [];
var queue =[]; // {floorPosition, cb}
let isQueueWorking = false;


btn_simulate.addEventListener("click", () => {
    // reset-if we simulate again with different values
    simulate_block.innerHTML ="";
    Lifts =[];
    Floors=[];

    var numberOfFloors = parseInt(inputFloors.value);
    var numberofLifts = parseInt(inputLifts.value);

    //validation
    if(isNaN(numberOfFloors) || isNaN(numberofLifts)){
        errortext.innerHTML = "There should be input in both fields";
    }
    else if(numberOfFloors <=0 || numberofLifts <= 0){
        errortext.innerHTML ="Lifts and Floors should be more than 0 ";
    }
    else{
        errortext.innerHTML =""; //to remove error text of earlier inputs
    //FLOOR CREATION ***********************************************8
        for (let i = numberOfFloors; i >= 0; i--) {
            //creating a node for floors
            const floorDiv = document.createElement('div');
            floorDiv.className = `floor`;
            floorDiv.id = `floor-${i}`;
            floorDiv.style.border = "1px solid gray";

            const floorNumber = document.createElement('div');
            floorNumber.className = "floor-number";
            floorDiv.appendChild(floorNumber);
    
            if (i == 0) {
                floorNumber.textContent = "G";
            }
            else {
                floorNumber.textContent = `${i}`;
            }
            //creating floor childs
            const floorBtns = document.createElement('div');
            floorBtns.className = "floor-buttons";
            floorDiv.appendChild(floorBtns);
            
        if (i != numberOfFloors) {
            const btnUp = document.createElement('button');
            btnUp.id = `btn-up-${i}`;
            let floorPosition = 100*i;
            btnUp.dataset.fl_position = floorPosition;
            btnUp.textContent = "▲";
            //adding click handeler and transfering my event to buttonClickHandeler
            btnUp.addEventListener("click", ()=>buttonClickHandeler(floorPosition, btnUp));
            floorBtns.appendChild(btnUp);
        }
        
        if (i != 0) {
            const btnDown = document.createElement('button');
            btnDown.id = `btn-down-${i}`;
            let floorPosition = 100*i;
            btnDown.dataset.fl_position = floorPosition;
            btnDown.textContent = "▼";
            //adding click handeler and transfering my event to buttonClickHandeler
            btnDown.addEventListener("click",  ()=> buttonClickHandeler(floorPosition, btnDown));
            floorBtns.appendChild(btnDown);
        }

        const floorSpace = document.createElement('div');
        floorSpace.className = "floor-space";
        floorDiv.appendChild(floorSpace);
        //adding nodes
        Floors.push(floorDiv);
        simulate_block.appendChild(floorDiv);
    }
    //LIFT CREATION *************************************************************************
    var liftPositionLeft = 0;
    const liftParentDiv = document.createElement('div');
    liftParentDiv.className = "lift-parent-div";
    for (let i = 0; i < numberofLifts; i++) {
        liftDiv = document.createElement("div");
        liftDiv.className = 'lift';
        liftDiv.dataset.ismoving = 0;
        liftDiv.dataset.position = 0;
        liftDiv.id = `lift-no-${i + 1}`;
        liftDiv.style.bottom = 0;
        liftDiv.style.left = liftPositionLeft + "px";
        liftPositionLeft += 60;
        
        
        liftDoor = document.createElement("div");
        liftDoor.className = 'lift-door';
        
        liftDiv.append(liftDoor);
        Lifts.push(liftDiv);
        liftParentDiv.appendChild(liftDiv);
    }
    simulate_block.appendChild(liftParentDiv);
    } //else ends here
});

//BUTTON CLICK HANDELER  {UP AND DOWN BOTH}
const buttonClickHandeler = async (floorPosition, btnElement) =>{
    if(btnElement.disabled) return; //checking if that button is already clicked and if yes - we return from here because that is already in queue
    //after click to any button, we doing this ~>
    btnElement.disabled = true;
    btnElement.style.color = "red";
    btnElement.style.border = "1px solid red";

    queue.push({
        floorPosition,
        cb : ()=>{
            //callbacks to be done once lift processing is done for the floor
                btnElement.disabled = false;
                btnElement.style.color = "white";
                btnElement.style.border = "2px solid white";
        }
    });

    await callingQueue();
}

//PROCESSING QUEUE HERE
const callingQueue =  () =>{
    if(isQueueWorking) return;
    isQueueWorking = true; //setting queue work to true to avoid multiple instance of callingQueue running

    while(queue.length >0){ //making sure queue calling queue does not stop till queue is exhausted
        const { floorPosition, cb} = queue.shift();   //picking the first element from the queue

        //now checking if any lift is idle
        const idleLifts = Lifts.filter((lift)=> lift.dataset.ismoving == 0);
        
        if(idleLifts.length >0){
            //now checking if any lifts at the same floor as the floor of item of queue
            const liftsAtCalledFloor = idleLifts.filter((idleLift)=>idleLift.dataset.position == floorPosition );
            if(liftsAtCalledFloor.length >0){
                const toMoveLift = liftsAtCalledFloor[0];
                 idleLiftMovement(toMoveLift, cb); //if the lift is called at the same floor
            }else{
                //finding the closest lift to the floor and moving that to the asked floor
                let minFloorDistance = Floors.length * 100 ;
                let closestLift;
                
                idleLifts.forEach((idleLift)=>{
                    let distanceBetweenLiftAndFloor = Math.abs(floorPosition - idleLift.dataset.position);
                    if(distanceBetweenLiftAndFloor < minFloorDistance){
                        minFloorDistance = distanceBetweenLiftAndFloor;
                        closestLift = idleLift;
                    }
                })
                if(!!closestLift){
                     moveLiftFunction(closestLift, floorPosition, cb); // making the actual move of the lift
                }
                }
        }else{ //if no idle lift then we are just pushing which are popped from the queue to maintin the actions
            // queue.push({floorPosition, cb});
            queue.unshift({ floorPosition, cb });  // Putting it back at the front
            break;
        }  
    }
    //resetting queue work to true when queue is exhausted and now queue is again ready to be populated
    isQueueWorking = false;
}
const idleLiftMovement = async (toMoveLift, cb) =>{
    toMoveLift.dataset.ismoving = 1;
    await openClosingDoor(toMoveLift);
    cb();  // now chnage the color and revert the attributes to earlier state for buttons
    toMoveLift.dataset.ismoving =0;

    if (queue.length > 0) {
        await callingQueue();  // Resume processing the queue if there are pending actions
    }
}

// total movement of lifts taking from queue
const moveLiftFunction = async (liftToMove, floorPosition, cb) =>{
    liftToMove.dataset.ismoving = 1;  //change the lift to moving position
    // await openClosingDoor(liftToMove); 

    //function to move lift to that floor
    await liftDraggingFunction(liftToMove, floorPosition);

    await openClosingDoor(liftToMove);
    cb();  // now chnage the color and revert the attributes to earlier state for buttons
    liftToMove.dataset.ismoving = 0;  //now change the lift to idle position

    if (queue.length > 0) {
        await callingQueue();  // Resume processing the queue if there are pending actions
    }
}

//lift dragging function from point A ot point P
const liftDraggingFunction =(lift, floorPosition) => new Promise((resolve)=>{
    //lift should move 1 floor in 2 seconds !  and each floor height is 100px;
    let delta = floorPosition - lift.dataset.position;
    //lets say delta is 400 i.e go to 4th floor, so total time will be 
    let timeTaken = (Math.abs(delta)/100)*2;
    lift.style.bottom =  floorPosition + "px";
    lift.style.transition = `bottom ${timeTaken}s ease-in-out`;
    
    setTimeout(()=>{
        //assigning new position to that particular lift
        lift.dataset.position = floorPosition;
        resolve();
    },timeTaken*1000);

})

//opening and closing of the door
const openClosingDoor = (lift) => new Promise((resolve)=>{ // total time 2.5+ 1.5+ 2.5 = 6.5seconds
    lift.childNodes[0].classList.add('door-opening');
    setTimeout(() => { // opening door time + staying for 1.5 seconds
        lift.childNodes[0].classList.remove('door-opening');
        setTimeout(()=>{ //closing door time
            resolve();
        },2500);
    }, 2500 + 1500); //2.5seconds for opening door, 1.5 seconds of stay to make passenger enter the lift 
});
