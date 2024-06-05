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
            // TODO: maybe add camera mode where cam follows worm to take advantage of 3d
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
        this.worm_position = Mat4.identity().times(Mat4.translation(0,0,1.8))
        this.worm_history = [];
        this.worm_direction = vec3(0, 0, 0);
        this.worm_speed = 0.10;
        this.worm_gap = 1.5/this.worm_speed;
        this.body_ct = 0; // can be used to calculate the score!

        // candy variables
        this.candies = [] // candy is now a simple array containing all the matrices of existing candies
        //TODO: add another array for a different candy type
        this.counter=0;
        this.last_candy_time = 0;
        this.candy_size = 0.8;

        // game state variables
        this.game_over_flag = false;
        this.turned = false;
        this.turn_time = 0;
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
        // TODO: adjust fx to take a param for which array to append matrix to (which candy type)
        this.candies.push(matrix);
    }

    detect_sphere_collision(a, b, r) {
        let diff = a.map((item, index)=> item[3] - b[index][3]);
        let dist = Math.sqrt(diff.reduce((accumulator, currentValue) => accumulator + currentValue**2, 0));
        return dist < r;
    }

    detect_candy_collision() {
        // TODO: check for collision with other candy type (should be similar, but diff effects!)

        for(let i = 0; i < this.counter; i ++) {
            if(this.detect_sphere_collision(this.worm_position, this.candies[i], 1 + this.candy_size)) { // should adjust if we change the snake side!
                // update worm size
                this.body_ct += 1;

                // remove candy from list
                this.candies.splice(i, 1);
                this.counter -= 1;

                // TODO: maybe increase speed as the worm grows? would have to update worm_speed and worm_gap = 1.5/ worm_speed
            }
        }
    }

    detect_end_collision() {
        // check if worm off board
        let x = this.worm_position[0][3];
        let y = this.worm_position[1][3];
        if (x < -0.25 || x >= (this.board_width-1) * 2 || y < -0.25 || y >= (this.board_height -1) * 2) {
            this.game_over_flag = true;
        }
        
        // check if worm hits itself
        for(let i = 1; i < this.body_ct + 1; i ++) {
            let matrix = this.worm_history[this.clamp(i * this.worm_gap, 0 , this.worm_history.length - 1)]
            if(this.detect_sphere_collision(this.worm_position, matrix, 1)) {
                console.log(this.worm_position);
                console.log(matrix)
                this.game_over_flag = true;
            }
        }
    }

    // helper math function
    clamp(x, min, max) {
        return x <= min ? min 
            : x >= max ? max 
            : x;
    }


    display(context, program_state) {
        super.display(context, program_state);
        this.drawboard(context, program_state);
        let color = hex_color('#EE4B2B');

        const t = program_state.animation_time / 1000;

        // check if worm is in game ending state (hit wall/self)
        if (this.game_over_flag) {
            // TODO: somehow visualize game over state - maybe display leaderboard
            this.worm_direction = vec3(0, 0, 0);
        } else {
            this.detect_end_collision();
        }

        // check if worm has hit candy and adjust state as required
        this.detect_candy_collision();

        // move worm head
        this.worm_position = this.worm_position.times(Mat4.translation(this.worm_direction[0], this.worm_direction[1], 0));

        // update history
        this.worm_history.unshift(this.worm_position)
        if (this.worm_history.length > this.worm_gap * (this.body_ct + 1)) {
            this.worm_history.pop();
        }

        // draw worm head
        this.shapes.worm.draw(context, program_state, this.worm_position, this.materials.worm);

        // draw worm body (make appropriate number of spheres trailing behind)
        for(let i = 1; i < (this.body_ct + 1); i ++) {
            let matrix = this.worm_history[this.clamp(i * this.worm_gap, 0 , this.worm_history.length - 1)];
            this.shapes.worm.draw(context, program_state, matrix,this.materials.worm);
        }

        // generate new candies as needed (if there are none remaining or sufficient time has passed)
        if( this.counter == 0 || this.counter < 5 && (t - this.last_candy_time > 5)){
            this.generate_candy();
            this.counter++;
            this.last_candy_time = t;
       }

       // draw candies
       this.candies.map(((elem)=>
            this.shapes.apple.draw(context, program_state, elem, this.materials.plastic.override({color: color}))
        ));
    }
}
