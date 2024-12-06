import "./InputNumber.css"
export default function InputNumber({ set_value,value }: { set_value: CallableFunction,value: string }) {
    return(
        <>
            <input
                className="input-number"
                type="number"
                placeholder={value}
                onChange={(event) => set_value(event.target.value)}
            />
        </>
    );
}