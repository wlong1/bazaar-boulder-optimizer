import { Item } from "./item";

export class Manager {
    constructor({
        items = [],
        limit = 20*10
    } = {}){
        this.items = items;
        this.limit = limit;
        this.time = 0;
    }

    simulate(context){
        const results = [];
        while (this.time <= this.limit){
            for (const item of this.items){
                let result = item.tick(context)
                if (result) results.push(result);

            }

            this.time += 1; 
        }
        console.log(results);
    }

}