import { useExtensionState } from "../../context/ExtensionStateContext"
import { vscode } from "../../utils/vscode"
import { memo } from "react"
import { formatLargeNumber } from "../../utils/format"

type HistoryPreviewProps = {
	showHistoryView: () => void
}

const HistoryPreview = ({ showHistoryView }: HistoryPreviewProps) => {
	const { taskHistory } = useExtensionState()
	const handleHistorySelect = (id: string) => {
		vscode.postMessage({ type: "showTaskWithId", text: id })
	}

	const formatDate = (timestamp: number) => {
		const date = new Date(timestamp)
		return date
			?.toLocaleString("en-US", {
				month: "long",
				day: "numeric",
				hour: "numeric",
				minute: "2-digit",
				hour12: true,
			})
			.replace(", ", " ")
			.replace(" at", ",")
			.toUpperCase()
	}

	return (
		<div style={{ flexShrink: 0 }}>
			<style>
				{`
					.history-preview-item {
						background-color: color-mix(in srgb, var(--vscode-toolbar-hoverBackground) 65%, transparent);
						border-radius: 4px;
						position: relative;
						overflow: hidden;
						opacity: 0.8;
						cursor: pointer;
						margin-bottom: 12px;
					}
					.history-preview-item:hover {
						background-color: color-mix(in srgb, var(--vscode-toolbar-hoverBackground) 100%, transparent);
						opacity: 1;
						pointer-events: auto;
					}
				`}
			</style>

			<div
				style={{
					color: "var(--vscode-descriptionForeground)",
					margin: "10px 20px 10px 20px",
					display: "flex",
					alignItems: "center",
				}}>
				<span
					className="codicon codicon-comment-discussion"
					style={{ marginRight: "4px", transform: "scale(0.9)" }}></span>
				<span
					style={{
						fontWeight: 500,
						fontSize: "0.85em",
						textTransform: "uppercase",
					}}>
					Recent Tasks
				</span>
			</div>

			<div style={{ padding: "0px 20px 0 20px" }}>
				{taskHistory
					.filter((item) => item.ts && item.task)
					.slice(0, 3)
					.map((item) => (
						<div
							key={item.id}
							className="history-preview-item"
							onClick={() => handleHistorySelect(item.id)}>
							<div style={{ padding: "12px" }}>
								<div style={{ marginBottom: "8px" }}>
									<span
										style={{
											color: "var(--vscode-descriptionForeground)",
											fontWeight: 500,
											fontSize: "0.85em",
											textTransform: "uppercase",
										}}>
										{formatDate(item.ts)}
									</span>
								</div>
								<div
									style={{
										fontSize: "var(--vscode-font-size)",
										color: "var(--vscode-descriptionForeground)",
										marginBottom: "8px",
										display: "-webkit-box",
										WebkitLineClamp: 3,
										WebkitBoxOrient: "vertical",
										overflow: "hidden",
										whiteSpace: "pre-wrap",
										wordBreak: "break-word",
										overflowWrap: "anywhere",
									}}>
									{item.task}
								</div>
							</div>
						</div>
					))}
			</div>
		</div>
	)
}

export default memo(HistoryPreview)
