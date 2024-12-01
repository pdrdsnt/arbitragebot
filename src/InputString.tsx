
export default function InputString({ set_value }: { set_value: CallableFunction }) {
    return(
        <>
            <input
                type="number"
                placeholder="Enter value..."
                onChange={(event) => set_value(event.target.value)}
            />
        </>
    );
}