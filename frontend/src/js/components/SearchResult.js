import React from "react";
import PersonIcon from "@material-ui/icons/Person";
import {NotFoundIndicator} from "./ErrorIndicator";

export const SearchResult = props => {
    const { data: persons = [] } = props;

    const renderPerson = (person, i) => {
        const { firstName = "", lastName = "", idDomain = "", confidence, imageBase64 } = person;
        return (
            <div key={`result-${i}`} className="search-result-person">
                <div className="search-result-photo">
                    <img src={`data:image/jpeg;base64,${imageBase64}`}  alt="Фото"/>
                </div>
                <div className="search-result-name">
                    <div className="search-result-icon"><PersonIcon /></div>
                    <div>{firstName} {lastName}</div>
                </div>
                <div className="search-result-profile">
                    <div className="search-result-icon"><img src="assets/icons/vk.svg" alt="vk"/></div>
                    <div><a href={`https://vk.com/${idDomain}`}>{idDomain}</a></div>
                </div>
                <div className="search-result-confidence">
                    <div className="search-result-icon"><img src="assets/icons/percent.svg" alt="percent"/></div>
                    <div>{confidence}</div>
                </div>
            </div>
        )
    };

    const renderResults = () => persons.map((person, i) => renderPerson(person, i));

    return (
        <>
            { persons.length === 0
                ? <NotFoundIndicator/>
                : <div className="search-result">{renderResults()}</div>
            }
        </>
    );
};
