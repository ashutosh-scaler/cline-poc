import { useCallback, useState } from "react"
import { useEvent } from "react-use"
import { ExtensionMessage } from "../../src/shared/ExtensionMessage"
import ChatView from "./components/chat/ChatView"
import { ExtensionStateContextProvider, useExtensionState } from "./context/ExtensionStateContext"

const AppContent = () => {
	const { didHydrateState } = useExtensionState()
	const [showSettings, setShowSettings] = useState(false)
	const [showHistory, setShowHistory] = useState(false)

	const handleMessage = useCallback((e: MessageEvent) => {
		const message: ExtensionMessage = e.data
		switch (message.type) {
			case "action":
				switch (message.action!) {
					case "settingsButtonClicked":
						setShowSettings(true)
						setShowHistory(false)
						break
					case "historyButtonClicked":
						setShowSettings(false)
						setShowHistory(true)
						break
					case "chatButtonClicked":
						setShowSettings(false)
						setShowHistory(false)
						break
				}
				break
		}
	}, [])

	useEvent("message", handleMessage)

	if (!didHydrateState) {
		return null
	}

	return (
		<ChatView
			showHistoryView={() => {
				setShowSettings(false)
				setShowHistory(true)
			}}
			isHidden={showSettings || showHistory}
			showAnnouncement={false}
			hideAnnouncement={() => {}}
		/>
	)
}

const App = () => {
	return (
		<ExtensionStateContextProvider>
			<AppContent />
		</ExtensionStateContextProvider>
	)
}

export default App
