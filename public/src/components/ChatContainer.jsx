import {useState, useEffect} from 'react';
import {useNavigate} from "react-router-dom";
import ChatInput from './ChatInput';
import ChatArea from './ChatArea';
import axios from 'axios';
import { deleteAllMessages, getAllMessageRoute, sendMessageRoute, updateNotification } from '../utils/APIRoutes';
import { MdDeleteForever } from "react-icons/md";
import { FaArrowLeftLong } from "react-icons/fa6";

export default function ChatContainer({currentChat, currentUser, socket}) {

    const navigate = useNavigate()
    const [msgs, setMsgs] = useState([])
    const [arrivalMessage, setArrivalMessage] = useState(null);

    const convertToUpperCase = ((text) => {
        return text.charAt(0).toUpperCase()+ text.slice(1)
    });

    useEffect(() => {
        const fetchData = async () => {
            if (currentChat) {
                const response = await axios.post(getAllMessageRoute, {
                  froms: currentUser._id,
                  tos: currentChat._id
                });
                setMsgs(response.data);
            }
        };
      
        fetchData();
      }, [currentChat, currentUser._id]);

    const handleSendMsg = (async (msg) => {
        await axios.post(sendMessageRoute, {
            from: currentUser._id,
            to: currentChat._id,
            message: msg
        });
        const time = new Date()
        socket.current.emit("send-msg", {
            to: currentChat._id,
            from: currentUser._id,
            message: msg,
            timeStamp: time
        });

        const msges = [...msgs];
        msges.push({fromSelf:true, msgs: msg, timeStamp: time})
        setMsgs(msges)
    });

    useEffect(() => {
        if(socket.current) {
            socket.current.on("msg-recieved", async (msg) => {
                const fetchedCurrentChat = JSON.parse(localStorage.getItem('current-chat'))
                if (msg.from === fetchedCurrentChat._id){
                    setArrivalMessage({fromSelf: false, msgs: msg.msg, timeStamp: msg.time});
                    await axios.post(updateNotification, {
                        uid: currentUser._id,
                        notification: 0,
                        from: fetchedCurrentChat._id
                    })
                }
            });
        }
    }, [currentChat, socket, currentUser._id]);

    useEffect(() => {
        arrivalMessage && setMsgs((prev) => [...prev, arrivalMessage]);
    }, [arrivalMessage]);

    const deleteMessages = async() => {
        await axios.post(deleteAllMessages, {
            froms: currentUser._id,
            tos: currentChat._id
        })

        const response = await axios.post(getAllMessageRoute, {
            froms: currentUser._id,
            tos: currentChat._id
          });
        setMsgs(response.data);
    }

    return(
        <>
            <div className='pt-4 w-[100vw] sm:w-[85vw] h-[100vh] sm:h-[84vh] grid grid-rows-12'>
                <div className="border-b border-[#997af0] px-5 sm:px-8 row-span-1 sm:row-span-2 flex justify-between items-center ">
                    <div className="w-full grid grid-cols-12 gap-4">
                        <button className='text-white col-span-1 flex justify-center items-center lg:hidden' onClick={() => navigate('/login')}>
                            <FaArrowLeftLong />
                        </button>
                        <div className="text-white xl:col-span-1 col-span-2">
                            <img src={`data:image/svg+xml;base64, ${currentChat.avatarImage}`} alt="avatar" className='h-10 sm:h-16'/>
                        </div>
                        <div className="text-white items-center flex text-3xl xl:col-span-10 col-span-6 font-semibold">
                            <h3>{convertToUpperCase(currentChat.username)}</h3>
                        </div>
                        <div className='text-white xl:col-span-1 col-span-3 text-3xl items-center justify-center flex'>
                            <button onClick={() => deleteMessages()}><MdDeleteForever/></button>
                        </div>
                    </div>
                </div>
                <div className='row-span-10 sm:row-span-9'>
                    <ChatArea messages={msgs}/>
                </div>
                <div className='row-span-1'>
                    <ChatInput handleSendMsg={handleSendMsg}/>
                </div>
            </div>
        </>
    )
}