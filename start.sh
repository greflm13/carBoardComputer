if ! screen -list | grep -q "server"; then
        cd /home/pi/carBoardComputer
        screen -S server -d -m npm start
fi