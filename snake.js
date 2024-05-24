import {defs, tiny} from './common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

class Cube extends Shape {
    constructor() {
        super("position", "normal",);
        // Loop 3 times (for each axis), and inside loop twice (for opposing cube sides):
        this.arrays.position = Vector3.cast(
            [-1, -1, -1], [1, -1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, -1], [-1, 1, -1], [1, 1, 1], [-1, 1, 1],
            [-1, -1, -1], [-1, -1, 1], [-1, 1, -1], [-1, 1, 1], [1, -1, 1], [1, -1, -1], [1, 1, 1], [1, 1, -1],
            [-1, -1, 1], [1, -1, 1], [-1, 1, 1], [1, 1, 1], [1, -1, -1], [-1, -1, -1], [1, 1, -1], [-1, 1, -1]);
        this.arrays.normal = Vector3.cast(
            [0, -1, 0], [0, -1, 0], [0, -1, 0], [0, -1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0],
            [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0],
            [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, -1], [0, 0, -1], [0, 0, -1], [0, 0, -1]);
        // Arrange the vertices into a square shape in texture space too:
        this.indices.push(0, 1, 2, 1, 3, 2, 4, 5, 6, 5, 7, 6, 8, 9, 10, 9, 11, 10, 12, 13,
            14, 13, 15, 14, 16, 17, 18, 17, 19, 18, 20, 21, 22, 21, 23, 22);
    }
}

class Cube_Outline extends Shape {
    constructor() {
        super("position", "color");
        const white=hex_color('#ffffff');
        // When a set of lines is used in graphics, you should think of the list entries as
        // broken down into pairs; each pair of vertices will be drawn as a line segment.
        // Note: since the outline is rendered with Basic_shader, you need to redefine the position and color of each vertex

        this.arrays.position = Vector3.cast(
        [-1, -1, -1], [1, -1, -1],
        [-1, -1, 1], [1, -1, 1],  
        [1, 1, -1], [-1, 1, -1],   
        [1, 1, 1], [-1, 1, 1],     
    

        [-1, -1, -1], [-1, -1, 1], 
        [-1, 1, -1], [-1, 1, 1],   
        [1, -1, 1], [1, -1, -1],   
        [1, 1, 1], [1, 1, -1],    

        [-1, -1, 1], [-1, 1, 1],   
        [1, -1, 1], [1, 1, 1],    
        [-1, 1, -1], [-1, -1, -1], 
        [1, 1, -1], [1, -1, -1]    
        )
        for (let i=0; i<24; i++){
            this.arrays.color.push(white);
        }
        this.indices=false;
    }
}

class Cube_Single_Strip extends Shape {
    constructor() {
        super("position", "normal");
        this.arrays.position = Vector3.cast(
            [-1, 1, 1], [1, 1, 1], [-1, -1, 1], [1, -1, 1], [-1, 1, -1], [1, 1, -1], [-1, -1, -1], [1, -1, -1])
        this.arrays.normal = Vector3.cast(
            [-1, 1, 1], [1, 1, 1], [-1, -1, 1], [1, -1, 1], [-1, 1, -1], [1, 1, -1], [-1, -1, -1], [1, -1, -1]);
        // Arrange the vertices into a square shape in texture space too:
        this.indices.push(0,1,2,3,6,7,4,5,0,1,5,3,7,2,6,0,5);
    
    }
}


class Base_Scene extends Scene {
    /**
     *  **Base_scene** is a Scene that can be added to any display canvas.
     *  Setup the shapes, materials, camera, and lighting here.
     */
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();
        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            'cube': new Cube(),
            'outline': new Cube_Outline(),
            'single_strip': new Cube_Single_Strip(),
        };
        this.color=[];
        // *** Materials
        this.materials = {
            plastic: new Material(new defs.Phong_Shader(),
                {ambient: .5, diffusivity: .6, specularity: 0.3, color: hex_color("#ffffff")}),
        };

        // The white material and basic shader are used for drawing the outline.
        this.white = new Material(new defs.Basic_Shader());
    }

    display(context, program_state) {
        // display():  Called once per frame of animation. Here, the base class's display only does
        // some initial setup.

        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(Mat4.translation(-7, -7, -30));
        }
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 100);

        // *** Lights: *** Values of vector or point lights.
        const light_position = vec4(0, 5, 5, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];
    }
}

export class snake extends Base_Scene {

    constructor(){
        super();
        this.shapes = {
            apple1: new defs.Subdivision_Sphere(4),
            apple2: new defs.Subdivision_Sphere(4),
            apple3: new defs.Subdivision_Sphere(4),
            apple4: new defs.Subdivision_Sphere(4),
            apple5: new defs.Subdivision_Sphere(4),
            cube: new defs.Cube,
        }

        this.materials = {
            apple: new Material(new defs.Phong_Shader(),
            {ambient: 1, diffusivity: .6, color: hex_color("#ffffff")}),
            plastic: new Material(new defs.Phong_Shader(),
                {ambient: .5, diffusivity: .6, specularity: 0.3, color: hex_color("#ffffff")}),
        } 
        
        this.apples=[0,0,0,0,0,0,0,0,0,0];
        this.counter=0;
        this.matrices = [
            Mat4.identity(), // Matrix for apple1
            Mat4.identity(), // Matrix for apple2
            Mat4.identity(), // Matrix for apple3
            Mat4.identity(), // Matrix for apple4
            Mat4.identity()  // Matrix for apple5
        ];
        this.index = [0,0,0,0,0];
        this.lastAppleTime = 0;
    }


    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        this.key_triggered_button("Change Direction", ["c"], this.set_colors);
    }

    drawboard(context, program_state){

        const green=hex_color('#568b34');
        const green2=hex_color('#49752d');

        

        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                let model_transform = Mat4.identity().times(Mat4.translation(i * 2, j * 2, 0));
                let diff=i+j;
                if (diff%2==0){
                    this.shapes.cube.draw(context, program_state, model_transform, this.materials.plastic.override({color: green}));
                }else{
                    this.shapes.cube.draw(context, program_state, model_transform, this.materials.plastic.override({color: green2}));
                }
            }
        }
    }

    drawapple(context, program_state, matrix, t){
        let row=0;
        let column=0;

        
        while(this.find(this.apples, 0, row) && this.find(this.apples, 1, column)){
            row=Math.floor(8*Math.random());
            column=Math.floor(8*Math.random());
        }
        this.apples[this.counter*2]=row;
        this.apples[this.counter*2+1]=column;
        matrix = matrix.times(Mat4.translation(row * 2, column * 2, 2)).times(Mat4.scale(0.8,0.8,0.8));

        let z = Math.floor(t);


    
        // console.log("Apple drawn")
        console.log(row)
        console.log(column)

        return matrix;
    }

    find(array, rc, value){
        for (let i=rc; i<array.length; i=i+2){
            if(array[i]==value){
                return true;
            }
        }
        return false;
    }


    display(context, program_state) {
        super.display(context, program_state);
        this.drawboard(context, program_state);
        let color = hex_color('#EE4B2B');


        

        const t = program_state.animation_time / 1000



        if( this.counter<5 && (t - this.lastAppleTime > 5)){
            let model_transform = this.drawapple(context, program_state, this.matrices[this.counter], t);
            this.matrices[this.counter] = model_transform;
            this.index[this.counter]=1;
            this.counter++;
            this.lastAppleTime = t;
            console.log("Apple 1 drawn");
       }


        if (this.index[0]!=0){
            this.shapes.apple1.draw(context, program_state, this.matrices[0], this.materials.plastic.override({color: color}));
            // console.log("Apple 1 drawn");
        }if(this.index[1]!=0){
            this.shapes.apple2.draw(context, program_state, this.matrices[1], this.materials.plastic.override({color: color}));
        }if(this.index[2]!=0){
            this.shapes.apple3.draw(context, program_state, this.matrices[2], this.materials.plastic.override({color: color}));
        }if(this.index[3]!=0){
            this.shapes.apple4.draw(context, program_state, this.matrices[3], this.materials.plastic.override({color: color}));
        }if(this.index[4]!=0){
            this.shapes.apple5.draw(context, program_state, this.matrices[4], this.materials.plastic.override({color: color}));
        }



    }

}