import { Item } from "./item";


export class Context {
    constructor({
        enemyHp = 10000,
        enemyShield = 0,
        selfHp = 10000,
        selfShield = 0
    } = {}){
        this.enemyHp = enemyHp;
        this.enemyShield = enemyShield;
        this.selfHpMax = selfHp;
        this.selfHpCur = selfHp;
        this.selfShield = selfShield;
        this.selfRegen = 0;
        this.enemyBurn = 0;
        this.enemyPoison = 0;
    }

    damage(amount){
        this.enemyHp -= Math.max(0, amount - this.enemyShield);
        this.enemyShield = Math.max(0, this.enemyShield - amount);
    }

    addEnemyBurn(amount){ this.enemyBurn += amount; }
    addEnemyPoison(amount){ this.enemyPoison += amount; }
    addSelfShield(amount){ this.selfShield += amount; }
    addSelfRegen(amount){ this.selfRegen += amount; }
    addSelfHeal(amount){ this.selfHpCur = Math.min(this.selfHpCur + amount, this.selfHpMax); }

    tick(time){
        // Burn applies twice a second
        // Poison applies once per second
        // 10 ticks per second
        if (this.enemyBurn > 0 && time % 5 == 0){
            // Burn deals half when shield exists
            if (this.enemyShield > 0){
                this.damage(Math.floor(this.enemyBurn/2));
            } else {
                this.enemyHp -= Math.floor(this.enemyBurn/2);
            }
            this.enemyBurn -= 1;
        }

        if (this.enemyPoison && time % 10 == 0){
            this.enemyHp -= this.enemyPoison;
        }

        return this.enemyHp <= 0;
    }
}

export class Manager {
    constructor({
        items = [],
        slots = {},
        limit = 20*10,
        context = new Context(),
    } = {}){
        this.items = items;
        this.slots = slots;
        this.limit = limit;
        this.time = 0;
        this.context = context;
    }

    applyResult(result){

    }

    simulate(){
        const results = [];
        const sandstorm = 30*10;
        let victory = false;

        while (this.time <= this.limit && !victory){
            results.length = 0;
            for (const item of this.items){
                let result = item.tick(this.context)
                if (result) this.applyResult(result);
            }

            if (this.time > sandstorm){
                this.context.damage(this.time - sandstorm);
            }

            victory = this.context.tick(this.time);
            this.time += 1;
        }
        console.log(results);
    }

}