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
    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        this.key_triggered_button("Change Direction", ["c"], this.set_colors);
    }

    drawboard(context, program_state){

        const green=hex_color('#568b34');
        const green2=hex_color('#49752d');
        // this.shapes.cube.draw(context, program_state, model_transform, this.materials.plastic.override({color:green})); 
        // model_transform=model_transform.times(Mat4.translation(2,0,0))
        // this.shapes.cube.draw(context, program_state, model_transform, this.materials.plastic.override({color:green2}));
        
        // for (let i=0; i<4; i++){
        //     let model_transform = Mat4.identity();
        //     let model_transform2 = Mat4.identity();
        //     for (let j=0; j<4; j++){
        //         if (i%2==0){
        //             if (i==0){
        //                 this.shapes.cube.draw(context, program_state, model_transform, this.materials.plastic.override({color:green}));
        //                 console.log("happened")
        //             }else{
        //                 this.shapes.cube.draw(context, program_state, model_transform, this.materials.plastic.override({color:green})); 
        //                 this.shapes.cube.draw(context, program_state, model_transform2, this.materials.plastic.override({color:green}));
        //             } 
        //         }else{
        //             this.shapes.cube.draw(context, program_state, model_transform, this.materials.plastic.override({color:green2}));
        //             this.shapes.cube.draw(context, program_state, model_transform2, this.materials.plastic.override({color:green2}));
        //         }
        //         model_transform=model_transform.times(Mat4.translation(2,0,0));
        //         model_transform2=model_transform2.times(Mat4.translation(-2,0,0));
        //     }
        // }

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


    display(context, program_state) {
        super.display(context, program_state);
        this.drawboard(context, program_state);
    }

}