type QueueMessageProps = {
	message: string
}

export default function QueueMessage({ message }: QueueMessageProps) {
	return (
		<p className="mb-3 rounded-lg border border-[#ffc107] bg-[#fff3cd] px-4 py-2 text-[0.95rem] font-semibold text-[#856404]">
			{message}
		</p>
	)
}
