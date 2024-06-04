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
        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(Mat4.translation(-7, -7, -30));
        }
        program_state.projection_transform = Mat4.perspective(Math.PI / 4, context.width / context.height, 1, 100);

        // *** Lights: *** Values of vector or point lights.
        const light_position = vec4(0, 5, 5, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];
    }
}

export class snake extends Base_Scene {

    constructor(){
        super();
        this.shapes = {
            apple: new defs.Subdivision_Sphere(4),
            worm: new defs.Subdivision_Sphere(4),
            cube: new defs.Cube,
        }

        this.materials = {
            apple: new Material(new defs.Phong_Shader(),
                {ambient: 1, diffusivity: .6, color: hex_color("#ffffff")}),
            plastic: new Material(new defs.Phong_Shader(),
                { ambient: .5, diffusivity: .6, specularity: 0.3, color: hex_color("#ffffff") }),
            worm: new Material(new defs.Phong_Shader(),
                { ambient: .5, diffusivity: .6, specularity: 0.3, color: hex_color("#8B4513") }),
            worm_hit: new Material(new defs.Phong_Shader(),
                { ambient: .5, diffusivity: .6, specularity: 0.3, color: hex_color("#00FFFF") }),
        }

        // board variables
        this.board_width = 10;
        this.board_height = 10;

        // worm variables
        this.worm_position = Mat4.identity().times(Mat4.translation(0,0,1.8));
        this.worm_body = [];
        this.worm_direction = vec3(0, 0, 0);
        this.worm_speed = 0.05;

        // candy variables
        this.candies = []
        this.counter=0;
        this.last_candy_time = 0;
        this.candy_size = 0.8;

        // game state variables
        this.collision_detected = false;
        this.game_over_flag = false;
    }


    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        this.key_triggered_button("Up", ["i"], () => this.worm_direction = vec3(0, this.worm_speed, 0));
        this.key_triggered_button("Down", ["k"], () => this.worm_direction = vec3(0, -this.worm_speed, 0));
        this.key_triggered_button("Left", ["j"], () => this.worm_direction = vec3(-this.worm_speed, 0, 0));
        this.key_triggered_button("Right", ["l"], () => this.worm_direction = vec3(this.worm_speed, 0, 0));
    }

    drawboard(context, program_state){
        const green=hex_color('#568b34');
        const green2=hex_color('#49752d');

        for (let i = 0; i < this.board_width; i++) {
            for (let j = 0; j < this.board_height; j++) {
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

    generate_candy() {
        // generate coordinates
        let row = Math.floor(this.board_height*Math.random());
        let column = Math.floor(this.board_width*Math.random());

        // make matrix
        let matrix = Mat4.identity().times(Mat4.translation(row * 2, column * 2, 1.8)).times(Mat4.scale(this.candy_size,this.candy_size,this.candy_size));

        // push onto candies array
        this.candies.push(matrix);
    }

    detect_candy_collision() {
        this.collision_detected = false;
        for(let i = 0; i < this.counter; i ++) {
            let diff = this.worm_position.map((item, index)=> item[3] - this.candies[i][index][3]);
            let dist = Math.sqrt(diff.reduce((accumulator, currentValue) => accumulator + currentValue**2, 0));
            if(dist < (1 + this.candy_size)) { // should adjust if we change the snake side!
                this.collision_detected = true;
                this.worm_body.push(this.worm_position.times(Mat4.translation(-1.5* this.worm_direction[0] / this.worm_speed, -1.5 * this.worm_direction[1]/ this.worm_speed, 0)))
                this.candies.pop(i);
                this.counter -= 1;
            }
        }
    }

    detect_end_collision() {
        // check if worm off board
        let x = this.worm_position[0][3];
        let y = this.worm_position [1][3];
        if (x < -0.25 || x >= (this.board_width-1) * 2 || y < -0.25 || y >= (this.board_height -1) * 2) {
            this.game_over_flag = true;
        }
        
        // add check if worm hits itself - should be similar to candy collision 
    }


    display(context, program_state) {
        super.display(context, program_state);
        this.drawboard(context, program_state);
        let color = hex_color('#EE4B2B');

        const t = program_state.animation_time / 1000

        // check if worm is in game ending stat (hit wall/self)
        this.detect_end_collision();
        if(this.game_over_flag) {
            this.worm_direction = vec3(0, 0, 0);
        }

        // check if worm has hit candy and adjust state as required
        this.detect_candy_collision();

        // move worm

        for(let i = this.worm_body.length - 1; i > 0; i --) {
            this.worm_body[i] = this.worm_body[i-1].times(Mat4.translation(-1.5 * this.worm_direction[0] / this.worm_speed, -1.5 * this.worm_direction[1]/ this.worm_speed, 0));
        }
        if(this.worm_body.length > 0) {
            this.worm_body[0] = this.worm_position.times(Mat4.translation(-1.5 * this.worm_direction[0] / this.worm_speed, -1.5 * this.worm_direction[1]/ this.worm_speed, 0));
        }
        this.worm_position = this.worm_position.times(Mat4.translation(this.worm_direction[0], this.worm_direction[1], 0));


        // draw worm
        this.shapes.worm.draw(context, program_state, this.worm_position, this.collision_detected ? this.materials.worm_hit : this.materials.worm);
        this.worm_body.map((elem) => 
            this.shapes.worm.draw(context, program_state, elem, this.collision_detected ? this.materials.worm_hit : this.materials.worm));



        // generate new candies as needed
        if( this.counter == 0 || this.counter < 5 && (t - this.last_candy_time > 5)){
            this.generate_candy();
            this.counter++;
            this.last_candy_time = t;
            console.log("candy drawn");
       }

       // draw candies
       this.candies.map(((elem)=>
            this.shapes.apple.draw(context, program_state, elem, this.materials.plastic.override({color: color}))
        ));
    }
}
