import React from 'react'
import { Link } from 'react-router-dom';


export default class Success extends React.Component {
    render() {
        return (
            <div className="w-100 py-3 justify-content-center">
                <div className="w-75 mx-auto text-center">
                    <h3>Congragulations {this.props.location.userName}!</h3>
                    <h3>Your score: { this.props.location.pokeballs }</h3>
                    <p>By completing the competition succesfully, you have been awarded with this rare and shiny Pikachu Card</p>
                    <img className="img-fluid img-thumbnail w-100" alt="prize" src="./img/prize.jpg"/>
                    <Link to={'/'}> <p className="btn btn-danger m-2 text-white">Start Over</p> </Link>

                </div>
            </div>
        )
    }
}
