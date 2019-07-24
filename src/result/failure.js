import React from 'react'
import { Link } from 'react-router-dom';


export default class Failure extends React.Component {
    render() {
        return (
            <div className="w-100 py-3 justify-content-center">
                <div className="w-75 mx-auto  text-center">
                    <h3>You are out of Pokeballs!</h3>
                    <Link to={'/'}> <p className="btn btn-success m-2 text-warning">Start Over</p> </Link>

                </div>
            </div>
        )
    }
}
