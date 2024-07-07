# Use the official Golang image as the base image
FROM golang:1.20

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy the Go module files and download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy the source code to the container
COPY . .

# Build the Go application
RUN go build -o AVS-WebAPI

# Expose the port the server will run on
EXPOSE 8080

# Command to run the application
CMD ["./AVS-WebAPI"]