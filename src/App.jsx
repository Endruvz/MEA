import { useState, useEffect } from 'react';
import './App.css';
import axios from "axios";
import Latex from "react-latex";
import katex from 'katex';
import 'katex/dist/katex.min.css';

const api_key = "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";
const api_eleven = "sk_bca9213bffdc02abc6c694113cc54e7aa1a63019ba3468e1";
const api_url = "https://api.openai.com/v1/chat/completions";
const url_eleven = "https://api.elevenlabs.io/v1/text-to-speech";


function App() {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([
    { text: 'Hello! How can I help you today?', isUser: false }
  ]);
  const [listening, setListening] = useState(false);


  useEffect(() => {
    const latexElements = document.querySelectorAll('.latex');
    latexElements.forEach((element) => {
      katex.render(element.textContent, element, {
        throwOnError: false,
      });
    });
  }, [messages]);

  function addMessage(text, isUser) {
    if (text.trim() !== "") {
      const newMessage = { text: text, isUser: isUser };
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages, newMessage];

        if (isUser === true) {
          sendUser(text, updatedMessages);
        }

        return updatedMessages;
      });
      setInputText('');
    }
  }

  function handleKeyPress(event) {
    if (event.key === 'Enter') {
      if (inputText.trim() !== '') {
        addMessage(inputText, true);
      }
    }
  }

  async function sendUser(sentInp, updatedMessages) {
    const msgs = [
      { role: "system", content: `
        You are an educational assistant.
        Try to help the user understand the study material with explanations.
        Don't use "###" or "**".
        If the user asks for external links for study or youtube videos, provide the link to the videos to them.
        Try to ask some questions for testing the user's understanding of the explanation.
        Always when writing formulas add an extra \n before them.
        Try to keep your responses at max about 300 words but only if needed so.
        Try different methods of explaining the material that the user provides.
        If you notice the user is less confused with one method of explaining the subject, try to use that method more.
        Always be enthusiastic and try to make learning fun.
        Try to be as human-like as possible.
      `},
      { role: "user", content: sentInp }
    ];

    try {
      const response = await axios.post(
        api_url,
        {
          model: 'gpt-4o-mini',
          messages: msgs,
          temperature: 0.7,
        },
        {
          headers: {
            'Authorization': `Bearer ${api_key}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const assistOdg = response.data.choices[0].message.content;
      let obrada = assistOdg.replace(/\$\$(.*?)\$\$/gs, `\\[ $1 \\]`);
      obrada = obrada.replace(/\$(.*?)\$/g, `\\( $1 \\)`);

      console.log('Assistant Response:', assistOdg);

      setMessages((prevMessages) => [
        ...updatedMessages,
        { text: obrada, isUser: false }
      ]);

      tts(assistOdg);
    } catch (error) {
      console.error('Error:', error);
      setMessages((prevMessages) => [
        ...updatedMessages,
        { text: 'Sorry, there was an error while fetching the response.', isUser: false }
      ]);
    }
  }

  async function tts(text) {
    try {
      console.log("Sending TTS request to Eleven Labs...");
      const response_el = await fetch(url_eleven, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${api_eleven}`,
        },
        body: JSON.stringify(data),
      });

      const audioUrl = response_el.data.audio_url;
      console.log("Audio URL:", audioUrl);

      const audio = new Audio(audioUrl);
      audio.play();
    } catch (error) {
      console.error('Error with Eleven Labs TTS:', error);
    }
  }

  const startListening = async () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.lang = 'en-US';
      recognition.start();

      recognition.onresult = (event) => {
        const spokenText = event.results[0][0].transcript;
        console.log('Speech recognition results: ', spokenText);
        handleChatGPTResponse(spokenText);
      };

      recognition.onerror = (e) => {
        console.log('Speech recognition error: ', e);
      };

      setListening(true);
    } catch (e) {
      console.error(e);
    }
  };

  const stopListening = () => {
    setListening(false);
  };

  const handleChatGPTResponse = (spokenText) => {
    addMessage(spokenText, true);
  };

  return (
    <>
      <div className="title">
        <h1>MEA</h1>
      </div>

      <div className="msg-space">
        {messages.map((message, index) => (
          <div key={index} className={message.isUser ? 'msg-u' : 'msg-c'}>
            {message.text.split("\n").map((line, index) => (
              <div key={index}>
                <Latex>{line}</Latex>
                <br />
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="in-main">
        <input
          type="text"
          className='input-ask'
          placeholder="Type your message here"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <button className='inp-b' onClick={listening ? stopListening : startListening}>
          {listening ? "Stop" : "Start"}
        </button>
        <button
          onClick={() => addMessage(inputText, true)}
          className='inp-b'
        >
          Send
        </button>
      </div>
    </>
  );
}

export default App;
