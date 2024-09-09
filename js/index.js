const btn_simulate = document.getElementById("simulate");
const simulate_block = document.getElementById("simulate-here");
const inputFloors = document.getElementById('input-floors');
const inputLifts = document.getElementById('input-lifts');
const errortext =  document.getElementById('error-text');

var Lifts = [];
var Floors = [];

btn_simulate.addEventListener("click", () => {
    simulate_block.innerHTML ="";
    var numberOfFloors = parseInt(inputFloors.value);
    var numberofLifts = parseInt(inputLifts.value);
    var totalHeight = (numberOfFloors) * 100;

    if(numberOfFloors ==0 || numberofLifts == 0){
        errortext.innerHTML ="Lifts and Floors should be more than 0 ";
    }
    else if(numberOfFloors < numberofLifts){
        errortext.innerHTML = "floors should not be less than lifts";
    }
    else{
        errortext.innerHTML =""; //to remove text of earlier inputs
    //FLOOR CREATION ***********************************************8
        for (let i = numberOfFloors; i >= 0; i--) {
            //creating a node for floors
            const floorDiv = document.createElement('div');
            floorDiv.className = `floor`
            floorDiv.id = `floor-${i}`
            floorDiv.style.border = "1px solid gray";
            
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
            btnUp.addEventListener("click", ()=> moveUp(floorPosition));
            floorBtns.appendChild(btnUp);
        }
        
        if (i != 0) {
            const btnDown = document.createElement('button');
            btnDown.id = `btn-down-${i}`;
            let floorPosition = 100*i;
            btnDown.dataset.fl_position = floorPosition;
            btnDown.addEventListener("click", ()=> moveDown(floorPosition));
            btnDown.textContent = "▼";
            floorBtns.appendChild(btnDown);
        }

        const floorSpace = document.createElement('div');
        floorSpace.className = "floor-space";
        floorDiv.appendChild(floorSpace);

        const floorNumber = document.createElement('div');
        floorNumber.className = "floor-number";
        floorDiv.appendChild(floorNumber);

        if (i == 0) {
            floorNumber.textContent = "Ground Floor";
        }
        else {
            floorNumber.textContent = `${i} Floor`;
        }

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
        
        leftDoor = document.createElement("div");
        leftDoor.className = 'left-door';
        
        rightDoor = document.createElement("div");
        rightDoor.className = 'right-door';
        
        liftDiv.append(leftDoor);
        liftDiv.append(rightDoor);
        Lifts.push(liftDiv);
        liftParentDiv.appendChild(liftDiv);
    }
    simulate_block.appendChild(liftParentDiv);

    } //else ends here
});

const moveUp = async (floorPosition) => {
   const idleLifts = Lifts.filter((lift)=> lift.dataset.ismoving == 0);
   const liftsAtCalledFloor = idleLifts.filter((idleLift) => idleLift.dataset.position == floorPosition);
   if(liftsAtCalledFloor.length>0){
       const toMoveLift = liftsAtCalledFloor[0];
       toMoveLift.dataset.ismoving =1;
       
       await openClosingDoor(toMoveLift);
       
       //calculation to move lift to that floor       
    //    await openClosingDoor(toMoveLift);
       toMoveLift.dataset.ismoving=0;
    }else{
        //finding closest lift  //// also we have idleLifts array    /// we also know floor position
        let minFloorDistance = Floors.length * 100 ;
        let idleLiftObject = {};

        idleLifts.forEach((idleLift)=>{
            let distanceBetweenLiftAndFloor = Math.abs(floorPosition - idleLift.dataset.position);
            if(distanceBetweenLiftAndFloor < minFloorDistance){
                minFloorDistance = distanceBetweenLiftAndFloor;
                idleLiftObject[distanceBetweenLiftAndFloor] = idleLift;
            }
        })
        const toMoveLift = idleLiftObject[minFloorDistance];

        toMoveLift.dataset.ismoving =1;
        
        await openClosingDoor(toMoveLift);
        
        //calculation to move lift to that floor
        await moveLiftFunction(toMoveLift, floorPosition); 
        
        
        await openClosingDoor(toMoveLift);
        toMoveLift.dataset.ismoving=0;

    }
}

const moveDown = async (floorPosition)=>{
   const toMoveLift = Lifts.find((lift)=> lift.dataset.ismoving == 0);
   toMoveLift.dataset.ismoving =1;
   await openClosingDoor(toMoveLift);

   //function to move lift to that floor
   await moveLiftFunction(toMoveLift, floorPosition); 

   await openClosingDoor(toMoveLift);
   toMoveLift.dataset.ismoving=0;
}

const moveLiftFunction =(lift, floorPosition) => new Promise((resolve)=>{
    //lift should move 1 floor in 2 seconds !  and each floor height is 100px;
    let delta = floorPosition - lift.dataset.position;
    //lets say delta is 400 i.e go to 4th floor, so total time will be 
    let timeTaken = (Math.abs(delta)/100)*2;
    lift.style.bottom =  floorPosition + "px";
    lift.style.transition = `bottom ${timeTaken}s ease-in-out`;
    
    setTimeout(()=>{
        lift.dataset.position = floorPosition;
        resolve();
    },timeTaken*1000);

})

//opening and closing of the door
const openClosingDoor = (lift) => new Promise((resolve)=>{ // total time 2.5+ 1.5+ 2.5 = 6.5seconds
    lift.childNodes[0].classList.add('door-opening');
    lift.childNodes[1].classList.add('door-opening');
    setTimeout(() => { // opening door time + staying for 1.5 seconds
        lift.childNodes[0].classList.remove('door-opening');
        lift.childNodes[1].classList.remove('door-opening');
        setTimeout(()=>{ //closing door time
            resolve();
        },2500);
    }, 2500 + 1500); //2.5seconds for opening door, 1.5 seconds of stay to make passenger enter the lift 
});
