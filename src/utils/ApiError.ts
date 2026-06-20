class ApiError extends Error{
        statusCode:number
        success: boolean
        errors:any[]

    constructor(
        statusCode : number,
        message = 'Something went Wrong!',
        errors =[]
    ){
        super(message)
        this.statusCode = statusCode
        this.message = message
        this.success = false
        this.errors=errors
    }
}

export default ApiError