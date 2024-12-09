
export class PromiseState<T> {
    promisse: Promise<T>;
    done: boolean = false;
    result: T | undefined;
    hasCalled: boolean = false;
    error: any = null;
    constructor(_result: Promise<T>) {
        this.promisse = _result;
    }

    async getState(): Promise<[boolean, T | undefined]> {

        if (this.hasCalled) return [this.done, this.result];

        try {
            this.result = await this.promisse;
        } catch (error) {
            this.done = true;
            this.error = error; // Store error if promise is rejected
        } finally {
            this.done = true;
        }

        this.hasCalled = true;
        return [this.done, this.result];
    }
}
