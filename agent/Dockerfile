FROM golang:1.21-alpine AS builder

WORKDIR /build

COPY go.mod ./
COPY . .
RUN go mod tidy && \
    CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o myprox-agent ./cmd/main.go

FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

COPY --from=builder /build/myprox-agent .

CMD ["./myprox-agent"]
