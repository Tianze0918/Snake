import {defs, tiny} from './common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture,
} = tiny;

const {Axis_Arrows, Textured_Phong} = defs

class Cube extends Shape {
    constructor() {
        super("position", "normal");
        this.arrays.position = Vector3.cast(
            [-1, -1, -1], [1, -1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, -1], [-1, 1, -1], [1, 1, 1], [-1, 1, 1],
            [-1, -1, -1], [-1, -1, 1], [-1, 1, -1], [-1, 1, 1], [1, -1, 1], [1, -1, -1], [1, 1, 1], [1, 1, -1],
            [-1, -1, 1], [1, -1, 1], [-1, 1, 1], [1, 1, 1], [1, -1, -1], [-1, -1, -1], [1, 1, -1], [-1, 1, -1]
        );
        this.arrays.normal = Vector3.cast(
            [0, -1, 0], [0, -1, 0], [0, -1, 0], [0, -1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0],
            [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0],
            [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, -1], [0, 0, -1], [0, 0, -1], [0, 0, -1]
        );
        this.indices.push(
            0, 1, 2, 1, 3, 2, 4, 5, 6, 5, 7, 6, 8, 9, 10, 9, 11, 10, 12, 13,
            14, 13, 15, 14, 16, 17, 18, 17, 19, 18, 20, 21, 22, 21, 23, 22
        );
    }
}

class Base_Scene extends Scene {
    constructor() {
        super();
        this.shapes = {
            'cube': new Cube(),
        };
        this.color = [];
        this.materials = {
            plastic: new Material(new defs.Phong_Shader(),
                {ambient: .5, diffusivity: .6, specularity: 0.3, color: hex_color("#ffffff")}),
        };
        this.white = new Material(new defs.Basic_Shader());
    }

    display(context, program_state) {
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            program_state.set_camera(Mat4.translation(-7, -7, -30));
        }
        program_state.projection_transform = Mat4.perspective(Math.PI / 4, context.width / context.height, 1, 100);
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
                { ambient: .5, diffusivity: .6, specularity: 0.3, color: hex_color("#ffc6c6") }),
            candy: new Material(new Textured_Phong(), {
                color: hex_color("#ffffff"),
                ambient: 0.5, diffusivity: 0.1, specularity: 0.1,
                texture: new Texture("assets/candy_texture.jpeg", 'LINEAR_MIPMAP_LINEAR')
            }),
            poison: new Material(new Textured_Phong(), {
                color: hex_color("#ffffff"),
                ambient: 0.5, diffusivity: 0.1, specularity: 0.1,
                texture: new Texture("assets/poison.jpeg", 'LINEAR_MIPMAP_LINEAR')
            }),
            dead_ui: new Material(new Textured_Phong(), {
                color: hex_color("#54188c"),
                ambient: 0.5, diffusivity: 0.1, specularity: 0.1,
                texture: new Texture("assets/You-Died.jpg", )
            }),
        }
        this.highscore = 0;
        this.board_width = 10;
        this.board_height = 10;
        this.reset_game();
    }

    reset_game() {
        this.currentscore = 0;
        this.worm_position = Mat4.identity().times(Mat4.translation(0,0,1.8))
        this.worm_history = [];
        this.worm_direction = vec3(0, 0, 0);
        this.worm_speed = 0.10;
        this.worm_gap = 1.5 / this.worm_speed;
        this.body_ct = 0;
        this.candies = [];
        this.counter = 0;
        this.last_candy_time = 0;
        this.candy_size = 0.8;
        this.poison = [];
        this.pcount = 0;
        this.poisont = [];
        this.poisont2 = [];
        this.poison_time = 0;
        this.last_poison_time = 0;
        this.game_over_flag = false;
        this.turned = false;
        this.turn_time = 0;
    }

    make_control_panel() {
        this.key_triggered_button("Up", ["i"], () => this.worm_direction = vec3(0, this.worm_speed, 0));
        this.key_triggered_button("Down", ["k"], () => this.worm_direction = vec3(0, -this.worm_speed, 0));
        this.key_triggered_button("Left", ["j"], () => this.worm_direction = vec3(-this.worm_speed, 0, 0));
        this.key_triggered_button("Right", ["l"], () => this.worm_direction = vec3(this.worm_speed, 0, 0));
        this.new_line();
        this.live_string(box => box.textContent = "Current Score: " + this.currentscore);
        this.new_line();
        this.live_string(box => box.textContent = "High Score: " + this.highscore);
        this.new_line();
        this.key_triggered_button("Reset Game", ["n"], () => this.reset_game());
    }

    drawboard(context, program_state){
        const blue = hex_color('#a6f5eb');
        const blue2 = hex_color('#249184');

        for (let i = 0; i < this.board_width; i++) {
            for (let j = 0; j < this.board_height; j++) {
                let model_transform = Mat4.identity().times(Mat4.translation(i * 2, j * 2, 0));
                let diff = i + j;
                if (diff % 2 == 0) {
                    this.shapes.cube.draw(context, program_state, model_transform, this.materials.plastic.override({color: blue}));
                } else {
                    this.shapes.cube.draw(context, program_state, model_transform, this.materials.plastic.override({color: blue2}));
                }
            }
        }
    }

    generate_candy() {
        let row = Math.floor(this.board_height * Math.random());
        let column = Math.floor(this.board_width * Math.random());
        let matrix = Mat4.identity().times(Mat4.translation(row * 2, column * 2, 1.8)).times(Mat4.scale(this.candy_size, this.candy_size, this.candy_size));
        this.candies.push(matrix);
    }

    generate_poison() {
        let row = Math.floor(this.board_height * Math.random());
        let column = Math.floor(this.board_width * Math.random());
        let matrix = Mat4.identity().times(Mat4.translation(row * 2, column * 2, 1.8)).times(Mat4.scale(this.candy_size, this.candy_size, this.candy_size));
        while (!this.candy_exist(matrix) && !this.poison_exist(matrix)) {
            row = Math.floor(this.board_height * Math.random());
            column = Math.floor(this.board_width * Math.random());
            matrix = Mat4.identity().times(Mat4.translation(row * 2, column * 2, 1.8)).times(Mat4.scale(this.candy_size, this.candy_size, this.candy_size));
        }
        this.poisont.push(Math.floor(Math.random() * (10 - 5 + 1)) + 3);
        this.poison.push(matrix);
    }

    candy_exist(matrix) {
        for (let i = 0; i < this.counter; i++) {
            if (matrix == this.candies[i])
                return false;
        }
        return true;
    }

    poison_exist(matrix) {
        for (let i = 0; i < this.counter; i++) {
            if (matrix == this.poison[i])
                return false;
        }
        return true;
    }

    detect_sphere_collision(a, b, r) {
        let diff = a.map((item, index) => item[3] - b[index][3]);
        let dist = Math.sqrt(diff.reduce((accumulator, currentValue) => accumulator + currentValue ** 2, 0));
        return dist < r;
    }

    detect_candy_collision() {
        for (let i = 0; i < this.counter; i++) {
            if (this.detect_sphere_collision(this.worm_position, this.candies[i], 1 + this.candy_size)) {
                this.body_ct += 1;
                this.candies.splice(i, 1);
                this.counter -= 1;
                this.currentscore++;
                if (this.highscore < this.currentscore) {
                    this.highscore = this.currentscore;
                }
            }
        }
    }

    detect_end_collision() {
        let x = this.worm_position[0][3];
        let y = this.worm_position[1][3];
        if (x < -0.25 || x >= (this.board_width - 1) * 2 || y < -0.25 || y >= (this.board_height - 1) * 2) {
            this.game_over_flag = true;
            this.currentscore = 0;
        }

        for (let i = 1; i < this.body_ct + 1; i++) {
            if(i * this.worm_gap < this.worm_history.length) {
                let matrix = this.worm_history[i * this.worm_gap];
                if (this.detect_sphere_collision(this.worm_position, matrix, 1)) {
                    console.log(this.worm_position);
                    console.log(matrix)
                    this.game_over_flag = true;
                    this.currentscore = 0;
                }
            }
        }
    }

    see_poison_time(t) {
        for (let i = 0; i < this.pcount; i++) {
            if (t - this.poisont2[i] > this.poisont[i]) {
                this.poison.splice(i, 1);
                this.poisont.splice(i, 1);
                this.poisont2.splice(i, 1);
                this.pcount -= 1;
            }
        }
    }

    display(context, program_state) {
        super.display(context, program_state);
        this.drawboard(context, program_state);
        let color = hex_color('#EE4B2B');

        const t = program_state.animation_time / 1000;

        if (this.game_over_flag) {
            this.worm_direction = vec3(0, 0, 0);
            let matrix = Mat4.identity().times(Mat4.translation(8.75, 9, 3)).times(Mat4.scale(8, 4, 1));
            this.shapes.cube.draw(context, program_state, matrix, this.materials.dead_ui);
        } else {
            this.detect_end_collision();
        }

        this.detect_candy_collision();
        this.see_poison_time();

        this.worm_position = this.worm_position.times(Mat4.translation(this.worm_direction[0], this.worm_direction[1], 0));

        if(!this.worm_direction.equals(vec3(0, 0, 0))) {
            console.log(this.worm_direction);
            this.worm_history.unshift(this.worm_position);
        }
        console.log(this.worm_history);
        if (this.worm_history.length > this.worm_gap * (this.body_ct + 1)) {
            this.worm_history.pop();
        }

        this.shapes.worm.draw(context, program_state, this.worm_position, this.materials.worm);

        for (let i = 1; i < (this.body_ct + 1); i++) {
            if(i * this.worm_gap < this.worm_history.length) {
                let matrix = this.worm_history[i * this.worm_gap];
                this.shapes.worm.draw(context, program_state, matrix, this.materials.worm);
            }
        }

        if (this.counter == 0 || this.counter < 5 && (t - this.last_candy_time > 5)) {
            this.generate_candy();
            this.counter++;
            this.last_candy_time = t;
        }

        this.see_poison_time(t);

        if (t - this.last_poison_time > this.poison_time) {
            this.generate_poison();
            console.log("poison generated");
            this.pcount++;
            this.poison_time = Math.floor(Math.random() * (10 - 5 + 1)) + 5;
            this.last_poison_time = t;
            this.poisont2.push(t);
        }

        this.candies.map(((elem) =>
            this.shapes.apple.draw(context, program_state, elem, this.materials.candy)
        ));

        this.poison.map(((elem) =>
            this.shapes.apple.draw(context, program_state, elem, this.materials.poison)
        ));
    }
}
