import React from "react";
import SearchIcon from "@material-ui/icons/Search";
import axios from "axios";
import {Dropzone} from "../components/Dropzone";
import {FILE_NOT_SELECTED, INVALID_FILE_FORMAT, INVALID_FILES_COUNT} from "../constants/errors";
import {LoadingIndicator} from "../components/LoadingIndicator";
import {ErrorIndicator} from "../components/ErrorIndicator";
import {SearchResult} from "../components/SearchResult";
import {IconButton, Typography} from "@material-ui/core";
import {Filters} from "../components/Filters";
import {getFilterForRequest} from "../helpers/getFilterForRequest";

export class SearchPage extends React.Component {

    constructor(props) {
        super(props);
        this.state = {pending: false, hasError: false, error: "", result: {}, wasSearch: false, filter: {} };

        this.onDropFiles = this.onDropFiles.bind(this);
        this.onSearchClick = this.onSearchClick.bind(this);
        this.setFilter = this.setFilter.bind(this);
    }

    onDropFiles(acceptedFiles = []) {
        if (acceptedFiles.length !== 1) {
            this.setState({ hasError: true, error: INVALID_FILES_COUNT });
            return;
        }

        if (!acceptedFiles[0].type.startsWith("image/")) {
            this.setState({ hasError: true, error: INVALID_FILE_FORMAT });
            return;
        }

        const formData = new FormData();
        formData.append("photo", acceptedFiles[0]);
        this.setState({ formData })
    }

    setFilter(filter) {
        this.setState({ filter: {...this.state.filter, ...filter} })
    }

    onSearchClick() {
        const { formData, filter } = this.state;
        if (!formData) {
            this.setState({ hasError: true, error: FILE_NOT_SELECTED });
            return;
        }

        const filterForRequest = getFilterForRequest(filter);

        formData.set("filter", JSON.stringify(filterForRequest));
        this.setState({ pending: true, hasError: false, wasSearch: true });
        axios
            .post("http://svapi:3000/api/findUser", formData, { headers: { "Content-Type": "multipart/form-data" } })
            .then(response => this.setState({ hasError: false, pending: false, result: response.data }))
            .catch(error => this.setState({ hasError: true, pending: false, error }));
    }

    render() {
        const { pending, hasError, error, result, wasSearch, formData, filter } = this.state;

        return (
            <div>
                <div className="drop-area">
                    <Dropzone onDrop={this.onDropFiles} selectedFile={formData}/>
                    <div id="search-button"><IconButton color="primary" onClick={this.onSearchClick}><SearchIcon/></IconButton></div>
                </div>
                <Filters filter={filter} setFilter={this.setFilter}/>
                <Typography variant="h4" align="center" id="serviceTitle">Результаты поиска</Typography>
                { pending && <LoadingIndicator text="Загрузка..."/> }
                { hasError && <ErrorIndicator error={error}/> }
                { !pending && !hasError && wasSearch && <SearchResult data={result}/> }
            </div>
        )
    }
}
